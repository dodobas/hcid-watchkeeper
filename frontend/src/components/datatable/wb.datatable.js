import * as Mustache from 'mustache';
import Pagination from '../pagination';
// WB datatable implementation

import {
    MAIN_TABLE_TEMPLATE,
    HEADER_ROW_TEMPLATE,
    createRowTemplateString
} from './templates/templates';


/**
 * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
 *
 * @param {String} text The text to be rendered.
 * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
 *
 * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
 */
function getTextWidth(text, font) {
    // re-use canvas object for better performance
    let canvas = getTextWidth.canvas || (getTextWidth.canvas = document.createElement("canvas"));
    let context = canvas.getContext("2d");
    context.font = font;
    let metrics = context.measureText(text);

    return metrics.width;
}

// console.log(getTextWidth("hello there!", "bold 12pt arial"));
//getTextWidth "300 16.8px Roboto"

/**
 * WB datatable
 *
 * sort je u bazi
 * paginacija dolazi iz baze
 * tablica samo ima znanje o trenutno prikazanoj dati
 * data-click-cb
 * data-context-cb
 * data-dialog-name
 *
 * data-row-id
 * data-row-index
 *
 * Pagination
 * - if paginationOnChangeCallback() is defined the pagination is handled by the server
 * - whole data is always shown
 */
export default class TableEvents {

    constructor(options) {

        const {
            data,
            fieldDef,
            uniqueKeyIdentifier = 'feature_uuid',
            whiteList,
            parentId,
            eventMapping,
            tableTemplateStr = MAIN_TABLE_TEMPLATE,
            headerTemplateStr = HEADER_ROW_TEMPLATE,
            paginationOnChangeCallback,
            columnClickCbName,
            fixedTableHeader = true,
            paginationConf = {},

            dataHandledByClient = true

        } = options;

        console.log('OPTIONS:', options);

        // options
        this.parentId = parentId;
        this.uniqueKeyIdentifier = uniqueKeyIdentifier;
        this.whiteList = whiteList;

        this.preparedData = [];

        this.rowIdToRowIndexMapping = {};

        // dom objects - parents
        this.parent = null;
        this.tHead = null;
        this.tBody = null;
        this.footer = null;

        // template strings
        this.headerTemplateStr = headerTemplateStr;

        this.tableTemplateStr = tableTemplateStr;

        this.rowTemplateStr = '';

        // todo
        // tbody row template
        this.rowTemplateStr = createRowTemplateString({
            fieldKeys: this.whiteList,
            columnClickCbName: columnClickCbName,
            rowIdKey: uniqueKeyIdentifier
        });

        // template options
        this.tableElementSelectors = {
            // most outer div
            className: 'wb-data-table',
            divTableWrapClass: 'wb-table-wrap',
            divTableClass: 'table_grid',
            divTableHeaderClass: 'table_grid_header_row',
            divTableBodyWrapClass: 'table_body_wrap',
            divTableBodyClass: 'table_body',

            footerClass: 'wb-table-footer',
            toolbarClass: 'wb-table-events-toolbar',

        };
        // this.tHead = this.parent.querySelector('.table_grid_header_row');
        // this.tBody = this.parent.querySelector('.table_body');
        this.fieldDef = {
            data: fieldDef
        };

        // event mapping - contextMenu, bodyClick, header
        this.eventMapping = eventMapping || {
            contextMenu: {},
            bodyClick: {},
            header: {}
        };

        // if true sort and pagination are handled "locally" - by the client
        this.dataHandledByClient = dataHandledByClient;

        this.paginationConf = paginationConf;

        // called on pagination change if pagination is handled by the server
        this.paginationOnChangeCallback = paginationOnChangeCallback;

        // fixed table header options
        this.fixedTableHeader = fixedTableHeader;


        this.initialParentSize = {};

        this.renderTable();
        this.initPagination();
    }

    /**
     * Set dom parents
     * Render data table layout from template
     * Render table header from white list (array of column keys)
     * Init pagination
     * Attach events to parents
     */
    renderTable = () => {

        this.parent = document.getElementById(this.parentId);

        this.initialParentSize = this.parent.getBoundingClientRect();

console.log(this.initialParentSize);
        this.parent.innerHTML = Mustache.render(
            this.tableTemplateStr,
            this.tableElementSelectors
        );

        this.tHead = this.parent.querySelector('.table_grid_header_row');
        this.tBody = this.parent.querySelector('.table_body');

        this.toolbar = this.parent.querySelector(`.${this.tableElementSelectors.toolbarClass}`);
        this.footer = this.parent.querySelector(`.${this.tableElementSelectors.footerClass}`);

        this.renderHeader();
        this.addEvents();

    };

    renderHeader = () => {
        this.tHead.innerHTML = Mustache.render(this.headerTemplateStr, this.fieldDef);
    };

    /**
     * Render table rows
     * - will always remove existing rows
     * - If this.dataHandledByClient is true pagination is handled by the client so the rendered data will be sliced
     * - If data is handled by the server the whole response will be rendered
     */
    renderBodyData = () => {
        let tableData;

        if (this.dataHandledByClient) {
            let pag = this.pagination.getPage();

            tableData = {
                data: this.preparedData.slice(pag.firstIndex, pag.lastIndex)
            };

        } else {
            tableData = {data: this.preparedData};
        }

        this.tBody.innerHTML = Mustache.render(this.rowTemplateStr, tableData);
    };


    renderToolbar = () => {
    };

    renderFooter = () => {
    };

    /**
     * For every item in array add its array index to item props
     * For every item create a mapping entry: uniqueId to array index
     *
     * @param data (array)
     * @param uniqueKey (string)
     * @returns {{preparedDataMapping, preparedData: Array, dataCnt: number}}
     */
    prepareData = (data, uniqueKey) => {

        let _prepared = [];
        let _mapping = {};

        data.slice(0).forEach((item, ix) => {
            let rowId = item[uniqueKey];

            // add row index to item
            item.index = ix;

            _prepared[_prepared.length] = item;
            _mapping[`${rowId}`] = ix;
        });

        return {
            preparedData: _prepared,
            preparedDataMapping: _mapping,
            dataCnt: _prepared.length
        }
    };

    /**
     * Set new table data and row id to row index mappings
     *
     * Add data row index to every item - needed for client side pagination / sort
     *
     * Every created row has a row index and row id data attribute
     *     <tr data-row-index="5" data-row-id="f95ee3d8-b1d1-47b3-bb5d-daf0126d4039">....</tr>
     *
     * For every created row there is a mapping added: row identifier (feature_uuid): row index
     *
     * On click the prepared row data is accessed using the row id
     *
     * @param tableData {recordsTotal: 1, recordsFiltered: 1, data: [{}]}
     * @param shouldRerender
     */
    setBodyData = (tableData, shouldRerender = false) => {
        // nmbr per page, page
        // stranicu na backend
        const {recordsTotal, recordsFiltered, data} = tableData;

        let {preparedData, preparedDataMapping, dataCnt} = this.prepareData(data, this.uniqueKeyIdentifier);

        // this.recordsTotal = recordsTotal || dataCnt;
        this.recordsTotal = recordsFiltered || dataCnt;

        this.updatePagination({});

        this.rowIdToRowIndexMapping = preparedDataMapping;

        this.preparedData = preparedData;

        if (shouldRerender === true) {
            this.renderBodyData();
        }

    };


    getRowDataByRowId = (rowId) => {
        let _rowIndex = this.rowIdToRowIndexMapping[rowId];

        return this.preparedData[_rowIndex];
    };

    getRowDataByRowIndex = (rowIndex) => {
        return this.preparedData[rowIndex];
    };

    /**
     * On body event (click, context, change...) searches for the closest  element starting from event.target
     * the tr element holds the row id and row index data attributes which identify the clicked row and its associated data
     * Returns found row index, row data and row id
     * @param e
     * @returns {{rowData: *, rowIndex: DOMStringMap.rowIndex, rowId: DOMStringMap.rowId}}
     */
    getRowPropsFromEvent = (e) => {
        // let row = e.target.closest('tr');
        let row = e.target.closest('[data-row-id]');

        let {rowIndex, rowId} = row.dataset;

        return {
            rowIndex,
            rowId,
            // rowData: this.preparedData[rowIndex]
            rowData: this.getRowDataByRowId(rowId)
        };
    };


    /**
     * Call a callback function from events mapping identified by its group name and function name
     *
     * The context menu event callback is bound to a column through the contextCb data attribute
     * The click event callback is bound to a column through the clickCb data attribute
     *
     *   <td
     *     data-context-cb='name-of-callback-fn'
     *     data-click-cb='name-of-callback-fn'>
     *   </td>
     *
     * For now the props argument is a object containing row props:
     *   props: {rowIndex, rowId, rowData}
     *
     * @param eventGroup (string)
     * @param fnName (string)
     * @param props ({})
     */
    handleTableEvent = ({eventGroup, fnName, props}) => {
        let fn = this.eventMapping[`${eventGroup}`][`${fnName}`];

        if (fn && fn instanceof Function) {
            fn.call(this, props);
        }
    };

    /**
     * Add basic table events
     * All events are delegated (set to event group parent)
     * Basic Event groups:
     *   - header click
     *      handles 3 column clicks, will set data attribute data-sort-dir to  0 | 1 | 2
     *
     *   - body (row column) click - identified by column clickCb data attribute
     *   - body context menu - identified by contextCb data attribute
     *   - table parent on scroll - sticky header implementation
     */
    addEvents = () => {
// TODO some checks will be needed, we assume that the right click was on the <td> element - currently there are no nested elements sso  no problems...

        // Table header click event
        this.tHead.addEventListener('click', (e) => {

            let headerCell = e.target.closest('.table_grid_header_cell');
            // let headerCell = e.target.closest('th');

            let {sortKey, sortDir, clickCb} = headerCell.dataset;

            let sortStates = ['', 'asc', 'desc'];

            let next = parseInt(sortDir || 0) + 1;

            let newDir = '';

            if (next >= sortStates.length) {
                next = 0;
                newDir = sortStates[0];
            } else {
                newDir = sortStates[next];
            }


            headerCell.dataset.sortDir = next;

            // handles 3 clicks per column - asc, desc, none
            this.handleTableEvent({
                eventGroup: 'header',
                fnName: `${clickCb}`,
                props: {
                    sortKey,
                    sortDir: newDir
                }
            });

        });

        // Table body click event
        this.tBody.addEventListener('click', (e) => {

            let {clickCb} = e.target.dataset;

            this.handleTableEvent({
                eventGroup: 'bodyClick',
                fnName: `${clickCb}`,
                props: this.getRowPropsFromEvent(e)
            });
        });

        // Table body context menu event
        // call context menu callback function indentified by contextCb data attribute
        this.tBody.addEventListener('contextmenu', (e) => {

            let {contextCb} = e.target.dataset;

            this.handleTableEvent({
                eventGroup: 'bodyClick',
                fnName: `${contextCb}`,
                props: this.getRowPropsFromEvent(e)
            });
        });

        // fixed table header - watch table parent scroll and translate thead for scrolltop
        // TODO - buggy behaviour
        if (this.fixedTableHeader === true) {


    //    this.tHead = this.parent.querySelector('.table_grid_header_row');
  //      this.tBody = this.parent.querySelector('.table_body');



            // let wrap=document.querySelector('.wb-table-wrap');

        let _tWrap = this.parent.querySelector('.wb-table-wrap');

            this.tHead.style.position = 'absolute';

            _tWrap.addEventListener('scroll', (e) =>{
                this.tHead.style.top = _tWrap.scrollTop + 'px';
            })


        }

    };

    // {firstIndex: 50, lastIndex: 100, currentPage: 2, itemsPerPage: 50, pageCnt: 391}
    /**
     * Initialize pagination for datatable
     * The data pagination can be handled by the client or by the server
     *
     * If pagination is handled by the client the data will be sliced using the pagination state
     *
     * If pagination is handled by the server:
     * - the pagination state will be passed to the provided pagination callback
     *       function this.paginationOnChangeCallback
     * - the server data response will be fully rendered (we assume backend paginated already)
     */
    initPagination = () => {

        let self = this;

        let pagConf = {
            itemsCnt: this.recordsTotal,
            itemsPerPage: 10,
            chartKey: 'offset',
            parent: this.footer,

            showItemsPerPage: true,
            itemsPerPageParent: this.toolbar,
            itemsPerPageKey: 'limit',
        };

        let conf = Object.assign({}, pagConf, this.paginationConf);

        if (!this.dataHandledByClient && this.paginationOnChangeCallback instanceof Function) {

            // go to next/previous page (offset)
            conf.pageOnChange = (name, page) => {
                this.paginationOnChangeCallback(name, page.firstIndex);
            };

            // items per page changed (limit)
            conf.itemsPerPageOnChange = (name, itemsPerPage) => {
                this.paginationOnChangeCallback(name, itemsPerPage);
            };

        } else {
            // go to next/previous page (local)
            // default callback - local pagination
            conf.pageOnChange = function (name, val) {
                self.renderBodyData();
            };

             // items per page changed (apply local)
            conf.itemsPerPageOnChange = function (name, val) {
                self.renderBodyData();
            }

        }

        this.pagination = Pagination(conf);
    };

    /**
     * Update pagination items count and set pagination page to 1
     * @param itemsCnt
     * @param currentPage
     */
    updatePagination = ({itemsCnt, currentPage}) => {
        const newOpts = {
            itemsCnt: itemsCnt || this.recordsTotal,
        //    currentPage: 1
        };

        if (currentPage !== undefined) {
            newOpts.currentPage = currentPage;
        }

        this.pagination.setOptions(newOpts)
    };
    // TO BE IMPLEMENTED - extend this class?

    registerDialog = (dialogName, dialogOptions) => {
    };
    showDialog = (dialogName) => {
    };
    hideDialog = (dialogName) => {
    };
    destroyDialog = (dialogName) => {
    };

    /**
     * Single row update function
     * When data changes the outer row dom object (<tr>) does not change only the inner does
     * The mapping between the data and the row stays intact
     *
     * Find the row, replace inner contents
     */
    updateBodyRow = () => {
    };

    /**
     * Resize table
     * Align with... parent ?
     */
    resizeTable = function () {

    };
}
