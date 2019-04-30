import {
    timestampColumnRenderer
} from "../../../templates.utils";
import WbFilter from "../../filter/wb.filter";
import TableEvents from "../../datatable/wb.datatable";

import API from '../../../api/api'

import DomFieldRenderer from "../../ui/DomFieldRenderer";
import {renderButtonGroup} from "../../buttonGroup";
import {TABLE_REPORT_EXPORT_BUTTONS_TEMPLATE} from "../../datatable/templates/templates";


const TREPORT_COLUMNS = [{
    key: '_last_update',
    label: 'Last Update',
    searchable: false,
    render: timestampColumnRenderer,
    orderable: true
}, {
    key: '_webuser',
    label: 'User',
    searchable: false,
    orderable: true
}];

const EXPORT_BUTTONS = [{
    url: '/export/csv',
    iconClass: 'fa-download',
    label: 'CSV'
}, {
    url: '/export/shp',
    iconClass: 'fa-download',
    label: 'SHP'
}, {
    url: '/export/xlsx',
    iconClass: 'fa-download',
    label: 'XLSX'
}];


export default function initTableReports({columnDefinitions, module}) {

    const TATBLE_EVENTS_COLUMNS = [...columnDefinitions, ...TREPORT_COLUMNS].slice(0);

    let filterDefinitions = [
        {
            filterId: 'zone',
            filterKey: 'zone',
            filterType: 'multiArr'
        },
        {
            filterId: 'woreda',
            filterKey: 'woreda',
            filterType: 'multiArr'
        },
        {
            filterId: 'tabiya',
            filterKey: 'tabiya',
            filterType: 'multiArr'
        },
        {
            filterId: 'kushet',
            filterKey: 'kushet',
            filterType: 'multiArr'


        }, {
            filterId: 'searchString',
            filterKey: 'searchString',
            filterType: 'single'

        }, { // set on header row click
            filterId: 'order',
            filterKey: 'order',
            filterType: 'multiObj'
        },

        {
            filterId: 'limit',
            filterKey: 'limit',
            filterType: 'single'
        },
        {
            filterId: 'offset',
            filterKey: 'offset',
            filterType: 'single'
        }];

    // Showing 1 to 10 of 19,497 entries

    // FILTER state HANDLER
    module.Filter = new WbFilter({
        config: filterDefinitions,
        onChange: function (activeFilters) {
            let filterState = getReportTableFilterArg();
            API.axFilterTableReportsData(JSON.stringify(filterState));
        }
    });


    // FILTERS DOM
    let selectizeFilterOptions = {
        onSelectCallBack: module.Filter.addToFilter,
        onUnSelectCallBack: module.Filter.removeFromFilter,
        onClearCallback:  module.Filter.clearFilter,
        isMultiSelectEnabled: true
    };
    
    let filterDomDefinitions = [
        {
            key: 'searchString',
            label: 'Text Search',
            onKeyPress: function (e) {
                module.Filter.setFilter('searchString', e.target.value);
            }
        }, {
            key: 'zone',
            label: 'Zone',
            isSelectized: true,
            selectizeOptions: selectizeFilterOptions
        }, {
            key: 'woreda',
            label: 'Woreda',
            isSelectized: true,
            selectizeOptions: selectizeFilterOptions
        }, {
            key: 'tabiya',
            label: 'Tabiya',
            isSelectized: true,
            selectizeOptions: selectizeFilterOptions
        }, {
            key: 'kushet',
            label: 'Kushet',
            isSelectized: true,
            selectizeOptions: selectizeFilterOptions

        }
    ];

    module.FilterDomInstance = new DomFieldRenderer({
        fieldDefinitions: filterDomDefinitions,
    });


    // TODO refactor
    /**
     * Prepare table reports api endpoint payload from filter state
     * @returns {{filter: *, search: (*|string), offset: (*|number), limit: number, order: (*|Array)}}
     */
    function getReportTableFilterArg() {

        let filt = WB.Filter.filters;

        let filtersOnly = _.reduce(filt, (acc, val, ix) => {

            if (['limit', 'offset', 'order', 'currentPage', 'searchString'].indexOf(ix) === -1) {
                // TODO do not include empty
                if (val.state.length > 0) {
                    acc[acc.length] = {[ix]: val.state};
                }
            }
            return acc;
        }, []);

        return {
            offset: filt.offset.state  || 0,
            limit: filt.limit.state || 25,
            search: filt.searchString.state || '',
            order: filt.order.state || [],
            filter: filtersOnly
        };
    }

    // datatable events callback functions
    let TABLE_EVENT_MAPPING = {
        contextMenu: {},
        bodyClick: {
            openFeatureInNewTab: function ({rowId, rowIndex, rowData}) {
                // open feature page in new tab
                const {feature_uuid} = rowData;

                const win = window.open(`/feature-by-uuid/${feature_uuid}/`, '_blank');

                win.focus();
            }
        },
        header: {
            // handle sort on table header cell click
            // set "order" filter
            columnClick: function ({sortKey, sortDir}) {

                let obj = {
                    [sortKey]: sortDir
                };
                // if sortDir is empty remove from filter
                if (!sortDir) {
                    module.Filter.removeFromFilter('order', obj)
                } else {
                    module.Filter.addToFilter('order', obj)
                }
            }
        }
    };


    module.TableEvents = new TableEvents({
        parentId: 'wb-table-Events',
        fixedTableHeader: true,

        fieldDef: TATBLE_EVENTS_COLUMNS,
        whiteList: TATBLE_EVENTS_COLUMNS.map((col) => col.key),
        eventMapping: TABLE_EVENT_MAPPING,
        columnClickCbName: 'openFeatureInNewTab',

        // callback when pagination page changes (next or previous) or number per page changes
        // set limit or offset
        paginationOnChangeCallback: function (name, val) {
            module.Filter.setFilter(`${name}`, val);
        }
    });



    // DOWNLOAD BUTTONS
    renderButtonGroup({
        parentSelector: '.wb-table-events-toolbar',
        templateData: EXPORT_BUTTONS,
        templateStr: TABLE_REPORT_EXPORT_BUTTONS_TEMPLATE,
        clickCb: function (e) {
            e.preventDefault();

            if (!e.target.href) {
                return;
            }
            //TODO review

            // append current table search to the url
            let searchStr = WB.Filter.filters.searchString.state;
            let downloadUrl = `${e.target.href}/?${encodeURI('search=' + searchStr)}`;

            window.open(downloadUrl, '_blank');

        }
    });




    module.getReportTableFilterArg = getReportTableFilterArg;

    let initialFilterState = getReportTableFilterArg();
    API.axFilterTableReportsData(JSON.stringify(initialFilterState));


    return module;
}
