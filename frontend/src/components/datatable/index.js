import {Modal} from '../modal';
import {getFormTemplate} from '../templates/wb.templates';
/**
 * Jquery datatable wrapper
 *
 * @param domId
 * @param options
 * @returns {TableReport}
 * @constructor
 */

export default class TableReport {
    constructor(domId, options) {
        this.dataTableOpts = options.dataTable;

        this.modalOpts = options.modalOpts;

        this.tableDomObj = null;

        this.reportTable = null;

        this.selectedRow = {};

        this.modal = new Modal({});

        this.init(domId);
    }

    /** TODO handle callbacks
     * Open and set content to modal
     *
     * data - html string
     * @param data
     */
    showModalForm = (data) => {
        const {title, modalOnOpenCb} = this.modalOpts;
        const templ = getFormTemplate(data, title);
        const content = $(templ);

        // TODO - review using the global modal instance...
        this.modal._setContent(content);
        this.modal._show();

        if (modalOnOpenCb && modalOnOpenCb instanceof Function) {
            modalOnOpenCb({
                modalObj: content
            });
        }
    };
    /**
     * Set dom, init datatable and add events
     * @param domId
     */
    init = (domId) => {
        this.tableDomObj = document.getElementById(domId);
        this.reportTable = $(this.tableDomObj).DataTable(this.dataTableOpts);
        this.addTableEvents();
    };

    redraw = (newData) => {
        newData = newData || [];
        this.reportTable.clear();
        this.reportTable.rows.add(newData);
        this.reportTable.draw();
    };

    addTableEvents = () => {
        let self = this;

        const {rowClickCb} = this.dataTableOpts;
        // enable table row click event, delegated
        if (rowClickCb instanceof Function) {
            this.tableDomObj.tBodies[0].addEventListener('click', function (e) {

                if (e.target && e.target.matches("td")) {
                    self.selectedRow = self.reportTable.row(e.target.parentNode).data();

                    rowClickCb(self.selectedRow, self);
                }

            })
        }

    }

}