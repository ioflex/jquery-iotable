/**
 * jquery-iotable is modeled after jquery-bootgrid
 */

/**
 * Grid Public Class Definition
 * 
 * Represents the jQuery IOTable plugin.
 * 
 * @class Grid
 * @constructor
 * @param element {Object} the corresponding DOM element.
 * @param options {Object} the options to override default options.
 * @chainable
 * @since 1.0.0
 **/

var Grid = function(element, options){
    // *** base DOM element used to construct the grid ***
    this.$element = $(element);
    // *** copy of the base ***
    this.$origin = this.$element.clone();
    this.options = $.extend(true, {}, Grid.defaults, this.$element.data(), options);
    this.columns = [];
    this.current = 1;
    this.currentRows = [];
    // *** The first column id that is marked as identifier ***
    this.identifier = null;
    this.selection = false;
    // *** The converter for the column that is marked as the identifier ***
    this.converter = null;
    
    // *** explicitly override resultCount because deep copy ($.extend) causes strange behaviour ***
    var resultCount = this.options.resultCount = this.$element.data().resultCount || options.resultCount || this.options.resultCount;
    this.resultCount = ($.isArray(resultCount)) ? resultCount[0] : resultCount;
    var resultsPerPage = this.options.resultsPerPage = this.$element.data().resultsPerPage || options.resultsPerPage || this.options.resultsPerPage;
    this.resultsPerPage = resultsPerPage;
    this.rows = [];
    this.searchPhrase = "";
    this.selectedRows = [];
    this.sortDictionary = {};
    this.total = 0;
    this.totalPages = 0;
    this.cachedParameters = {
        lbl: this.options.labels,
        css: this.options.css,
        ctx: {}
    };
    this.header = null;
    this.footer = null;
    this.xqr = null;
}

/**
 * Object that represents the default grid settings.
 * 
 * @static
 * @class defaults
 * @for Grid
 * @example
 *     // *** Global Approach ***
 *     $.iotable.defaults.selection = true;
 * @example
 *     // *** Initialization Approach ***
 *     $("#iotable").iotable({selection = true});
 * @since 1.0.0
 **/

Grid.defaults = {
    /**
     * Flag:
     * 0 = none
     * 1 = top
     * 2 = bottom
     * 3 = both (top and bottom)
     */
    navigation: 3,

    /**
     * Page padding (pagination)
     */
    padding: 2,

    /**
     * Column selection enabled
     * 
     * @property columnSelection
     * @type Boolean
     * @default false
     * @for defaults
     * @since 1.0.0
     */
    columnSelection: true,

    /**
     * Total records / rows to query for:
     * Can be int or Array
     * -1 represents "All"
     * 
     * @property resultCount
     * @type Numeric Array
     * @default [10, 25, 50, 100, -1]
     * @for defaults
     * @since 1.0.0
     */
    resultCount: [10, 25, 50, 100, -1],

    /**
     * Total rows displayed per page.
     * @property resultsPerPage
     * @type Numeric
     * @default 10
     * @for defaults
     * @since 1.0.0
     */
    resultsPerPage: 10,

    /**
     * Enables row selection
     * To enable multi row selection see also 'multiSelect'
     * 
     * @property selection
     * @type Boolean
     * @default false
     * @for defaults
     * @since 1.0.0
     */
    selection: false,

    /**
     * Enables multi selection
     * @requires selection: true
     * @property multiSelect
     * @type Boolean
     * @default false
     * @for defaults
     * @since 1.0.0
     */
    multiSelect: false,

    /**
     * Enables entire row click selection
     * 
     * @requires selection: true
     * @property rowselect
     * @type Boolean
     * @default false
     * @for defaults
     * @since 1.0.0
     */
    rowSelect: false,

    /**
     * Defines whether the row selection is saved internally on filtering, paging, and sorting
     * even if the selected rows are not visible
     * 
     * @property keepSelection
     * @type Boolean
     * @default false
     * @for defaults
     * @since 1.0.0
     */
    keepSelection: false,

    /**
     * Highlight new rows
     * Find the page of the first new row
     * 
     * @property highlightRows
     * @type Boolean
     * @default false
     * @for defaults
     * @since 1.0.0
     */
    highlightRows: false,

    /**
     * Column sorting
     * 
     * @property sorting
     * @type Boolean
     * @default true
     * @for defaults
     * @since 1.0.0
     */
    sorting: true,

    /**
     * Multiple column sorting
     * 
     * @requires sorting: true
     * @property multiSorting
     * @type Boolean
     * @default false
     * @for defaults
     * @since 1.0.0
     */
    multiSorting: false,

    /**
     * General search settings
     * 
     * @property searchSettings
     * @type Object
     * @for defaults
     * @since 1.0.0
     */
    searchSettings: {
        /**
         * Time in milliseconds to wait before a search gets executed.
         * 
         * @property delay
         * @type Number
         * @default 250
         * @for searchSettings
         */
        delay: 250,

        /**
         * Number of characters typed before a search is executed.
         * 
         * @property characters
         * @type Number
         * @default 1
         * @for searchSettings
         */
        characters: 1
    },

    /**
     * Defines whether the data shall be loaded via an asynchronous HTTP (AJAX) request.
     * 
     * @property ajax
     * @type Boolean
     * @default false
     * @for defaults
     */
    ajax: false,

    /**
     * AJAX request settings that will be used for server-side communication.
     * All settings except data, error, success and url can be overridden.
     * For the full list of settings go to http://api.jquery.com/jQuery.ajax/.
     * 
     * @property ajaxSettings
     * @type Object
     * @for defaults
     * @since 1.0.0
     */
    ajaxSettings: {
        /**
         * Specifies the HTTP method which will be used when sending data to the server.
         * Go to http://api.jquery.com/jQuery.ajax/ for more details.
         * This setting is overriden for backward compatibility.
         */
        method: "POST"
    },

    /**
     * The data URL to a data service.
     * E.G. a RESTFul api
     * Either a `String` or a `Function` that returns a `String` can be passed.
     * 
     * @property url
     * @type String|Function
     * @default ""
     * @for defaults
     */
    url: "",

    /**
     * Defines whether the search is case sensitive.
     * 
     * @property caseSensitive
     * @type Boolean
     * @default true
     * @for defaults
     * @since 1.0.0
     */
    caseSensitive: true,

    /**
     * Enriches the request object with additional properties. Either a `PlainObject` or a `Function`
     * that returns a `PlainObject` can be passed. Default value is `{}`.
     *
     * @property post
     * @type Object|Function
     * @default function (request) { return request; }
     * @for defaults
     * @deprecated Use instead `requestHandler`
     **/
    post: {}, // or use function () { return {}; } (reserved properties are "current", "resultCount", "sort" and "searchPhrase")

    /**
     * Transforms the JSON request object in what ever way is required by the server-side implementation.
     * 
     * @property requestHandler
     * @type Function
     * @default function(request){return request;}
     * @for defaults
     * @since 1.0.0
     */
    requestHandler: function(request){return request;},

    /**
     * Transforms the response object into the expected JSON response object.
     * 
     * @property responseHandler
     * @type Function
     * @default function(response){return response;}
     * @for defaults
     * @since 1.0.0
     */
    responseHandler: function(response){return response;},

    /**
     * A list of converters.
     * 
     * @property converters
     * @type Object
     * @for defaults
     * @since 1.0.0
     */
    converters: {
        numeric: {
            /**
             * Converts from `String` > `Numeric`
             * @param {*} value 
             */
            from: function(value){return +value;},
            /**
             * Converts from `Numeric` > `String`
             * @param {*} value
             */
            to: function(value){return value + "";}
        },
        string: {
            /**
             * Default converter
             */
            from: function(value){return value;},
            to: function(value){return value;}
        }
    },

    /**
     * Contains all css classes.
     * 
     * @property css
     * @type Object
     * @for defaults
     */
    css: {
        actions: "io-table-actions btn-group",
        center: "text-center",
        columnHeaderAnchor: "io-table-col-header-anchor",
        columnHeaderText: "text",
        dropDownItem: "dropdown-item",
        dropDownItemBtn: "dropdown-item-button",
        dropDownItemCheckbox: "dropdown-item-checkbox",
        dropDownMenu: "dropdown btn-group",
        dropDownMenuItems: "dropdown-menu pull-right",
        dropDownMenuText: "dropdown-text",
        footer: "io-table-footer container-fluid",
        header: "io-table-header container-fluid",
        icon: "icon glyphicon",
        iconColumns: "glyphicon-th-list",
        iconDown: "glyphicon-chevron-down",
        iconRefresh: "glyphicon-refresh",
        iconSearch: "glyphicon-search",
        iconUp: "glyphicon-chevron-up",
        infos: "infos",
        left: "text-left",
        pagination: "pagination",
        paginationButton: "button",
        responsiveTable: "table-responsive",
        right: "text-right",
        search: "search form-group",
        searchField: "search-field form-control",
        selectBox: "select-box",
        selectCell: "select-cell",
        selected: "active",
        sortable: "sortable",
        table: "io-table table"
    },

    /**
     * A dictionary of formatters.
     * 
     * @property formatters
     * @type Object
     * @default {}
     * @for defaults
     * @since 1.0.0
     */
    formatters: {},

    /**
     * Contains all labels.
     * 
     * @property labels
     * @type Object
     * @for defaults
     * @since 1.0.0
     */
    labels: {
        all: "All",
        infos: "Showing {{ctx.start}} to {{ctx.end}} of {{ctx.total}} entries",
        loading: "Loading..",
        noResults: "No results found!",
        refresh: "Refresh",
        search: "Search"
    },

    /**
     * Specifies the mapping between status and contextual classes to color the rows.
     * 
     * @property statusMapping
     * @type Object
     * @for defaults
     * @since 1.0.0
     */
    statusMapping: {
        /**
         * Specifies a successful or positive action.
         * 
         * @property 0
         * @type String
         * @for statusMapping
         * @since 1.0.0
         */
        0: "success",

        /**
         * Specifies a neutral informative change or action.
         * 
         * @property 1
         * @type String
         * @for statusMapping
         * @since 1.0.0
         */
        1: "info",

        /**
         * Specifies a warning that might need attention.
         * 
         * @property 2
         * @type String
         * @for statusMapping
         * @since 1.0.0
         */
        2: "warning",

        /**
         * Specifies a dangerous or potentially negative action.
         * 
         * @property 3
         * @type String
         * @for statusMapping
         * @since 1.0.0
         */
        3: "danger"
    },

    /**
     * Contains all templates.
     *
     * @property templates
     * @type Object
     * @for defaults
     * @since 1.0.0
     **/
    templates: {
        actionButton: "<button class=\"btn btn-default\" type=\"button\" title=\"{{ctx.text}}\">{{ctx.content}}</button>",
        actionDropDown: "<div class=\"{{css.dropDownMenu}}\"><button class=\"btn btn-default dropdown-toggle\" type=\"button\" data-toggle=\"dropdown\"><span class=\"{{css.dropDownMenuText}}\">{{ctx.content}}</span> <span class=\"caret\"></span></button><ul class=\"{{css.dropDownMenuItems}}\" role=\"menu\"></ul></div>",
        actionDropDownItem: "<li><a data-action=\"{{ctx.action}}\" class=\"{{css.dropDownItem}} {{css.dropDownItemButton}}\">{{ctx.text}}</a></li>",
        actionDropDownCheckboxItem: "<li><label class=\"{{css.dropDownItem}}\"><input name=\"{{ctx.name}}\" type=\"checkbox\" value=\"1\" class=\"{{css.dropDownItemCheckbox}}\" {{ctx.checked}} /> {{ctx.label}}</label></li>",
        actions: "<div class=\"{{css.actions}}\"></div>",
        body: "<tbody></tbody>",
        cell: "<td class=\"{{ctx.css}}\" style=\"{{ctx.style}}\">{{ctx.content}}</td>",
        footer: "<div id=\"{{ctx.id}}\" class=\"{{css.footer}}\"><div class=\"row\"><div class=\"col-sm-6\"><p class=\"{{css.pagination}}\"></p></div><div class=\"col-sm-6 infoBar\"><p class=\"{{css.infos}}\"></p></div></div></div>",
        header: "<div id=\"{{ctx.id}}\" class=\"{{css.header}}\"><div class=\"row\"><div class=\"col-sm-12 actionBar\"><p class=\"{{css.search}}\"></p><p class=\"{{css.actions}}\"></p></div></div></div>",
        headerCell: "<th data-column-id=\"{{ctx.column.id}}\" class=\"{{ctx.css}}\" style=\"{{ctx.style}}\"><a href=\"javascript:void(0);\" class=\"{{css.columnHeaderAnchor}} {{ctx.sortable}}\"><span class=\"{{css.columnHeaderText}}\">{{ctx.column.text}}</span>{{ctx.icon}}</a></th>",
        icon: "<span class=\"{{css.icon}} {{ctx.iconCss}}\"></span>",
        infos: "<div class=\"{{css.infos}}\">{{lbl.infos}}</div>",
        loading: "<tr><td colspan=\"{{ctx.columns}}\" class=\"loading\">{{lbl.loading}}</td></tr>",
        noResults: "<tr><td colspan=\"{{ctx.columns}}\" class=\"no-results\">{{lbl.noResults}}</td></tr>",
        pagination: "<ul class=\"{{css.pagination}}\"></ul>",
        paginationItem: "<li class=\"{{ctx.css}}\"><a data-page=\"{{ctx.page}}\" class=\"{{css.paginationButton}}\">{{ctx.text}}</a></li>",
        rawHeaderCell: "<th class=\"{{ctx.css}}\">{{ctx.content}}</th>", // Used for the multi select box
        row: "<tr{{ctx.attr}}>{{ctx.cells}}</tr>",
        search: "<div class=\"{{css.search}}\"><div class=\"input-group\"><span class=\"{{css.icon}} input-group-addon {{css.iconSearch}}\"></span> <input type=\"text\" class=\"{{css.searchField}}\" placeholder=\"{{lbl.search}}\" /></div></div>",
        select: "<input name=\"select\" type=\"{{ctx.type}}\" class=\"{{css.selectBox}}\" value=\"{{ctx.value}}\" {{ctx.checked}} />"
    }
};

/**
 * Append rows.
 * 
 * @method append
 * @param rows {Array} An array of rows to append
 * @chainable
 * @since 1.0.0
 */
Grid.prototype.append = function(rows){
    if(this.options.ajax){
        // TODO: Implement ajax handler to insert rows to api / server-side service
    }else{
        var appendedrows = [];
        for(var i = 0; i < rows.length; i += 1){
            if(appendRow.call(this, rows[i])){
                appendedrows.push(rows[i]);
            }
        }
        sortRows.call(this);
        highlightAppendedRows.call(this, appendedrows);
        loadData.call(this);
        this.$element.trigger("appended" + namespace, [appendedrows]);
    }
    return this;
};

/**
 * Clear all rows.
 * 
 * @method clear
 * @chainable
 * @since 1.0.0
 */
Grid.prototype.clear = function(){
    if(this.options.ajax){
        // TODO: Implement ajax handler to delete all records from api / server-side service
        // *** This may be a terrible idea ***
    }else{
        var removedRows = $.extend([], this.rows);
        this.rows = [];
        this.current = 1;
        this.total = 0;
        loadData.call(this);
        this.$element.trigger("cleared" + namespace, [removedRows]);
    }
    return this;
};

/**
 * Removes the control functionallity completely and transforms the current state to the initial HTML structure.
 * 
 * @method destroy
 * @chainable
 * @since 1.0.0
 */
Grid.prototype.destroy = function(){
    // TODO: Optimize this, the complete intial state must be restored
    $(window).off(namespace);

    if(this.options.navigation & 1){
        this.header.remove();
    }

    if(this.options.navigation & 2){
        this.footer.remove();
    }

    this.$element.before(this.$origin).remove();
    return this;
};

/**
 * Resets the state and reloads rows.
 * 
 * @method reload
 * @chainable
 * @since 1.0.0
 */
Grid.prototype.reload = function(){
    this.current = 1; // reset
    loadData.call(this);
    return this;
};

/**
 * Removes rows by id.
 * Removes selected rows if no ids are provided.
 * 
 * @method remove
 * @param [rowIds] {Array} An array of row ids to remove
 * @chainable
 * @since 1.0.0
 */
Grid.prototype.remove = function(rowIds){
    if(this.identifier !== null){

        if(this.options.ajax){
            // TODO: Implement AJAX delete functionallity
        }else{
            rowIds = rowIds || this.selectedRows;

            var id,
                removedRows = [];
            
            for(var i = 0; i < rowIds.length; i += 1){
                id = rowIds[i];
                for(var j = 0; j < this.rows.length; j += 1){
                    if(this.rows[j][this.identifier] === id){
                        removedRows.push(this.rows[j]);
                        this.rows.splice(j, 1);
                        break;
                    }
                }
            }

            this.current = 1; // reset
            loadData.call(this);
            this.$element.trigger("removed" + namespace, [removedRows]);
        }
    }
    return this;
};

/**
 * Searches visible rows for a specific searchPhrase.
 * The searchPhrase will be reset if no argument is provided.
 * 
 * @method search
 * @param [phrase] {String} The phrase to search for
 * @chainable
 * @since 1.0.0
 */
Grid.prototype.search = function(phrase){
    phrase = phrase || "";

    if(this.searchPhrase !== phrase){
        var selector = getCssSelector(this.options.css.searchField),
            searchFields = findFooterAndHeaderItems.call(this, selector);
        searchFields.val(phrase);
    }
    executeSearch.call(this, phrase);
    return this;
};

/**
 * Selects rows by ids.
 * Selects all visible rows if no ids are provided.
 * Server-side scenarios only visible rows are selectable.
 * 
 * @method select
 * @param [rowIds] {Array} An array of row ids to select
 * @chainable
 * @since 1.0.0
 */
Grid.prototype.select = function(rowIds){
    if(this.selection){
        rowIds = rowIds || this.currentRows.propValues(this.identifier);

        var id,
            i,
            selectedRows = [];
        
        while(rowIds.length > 0 && !(!this.options.multiselect && selectedRows.length === 1)){
            id = rowIds.pop();
            if($.inArray(id, this.selectedRows) === -1){
                for(i = 0; i < this.currentRows.length; i += 1){
                    if(this.currentRows[i][this.identifier] === id){
                        selectedRows.push(this.currentRows[i]);
                        this.selectedRows.push(id);
                        break;
                    }
                }
            }
        }

        if(selectedRows.length > 0){
            var selectBoxSelector = getCssSelector(this.options.css.selectBox),
                selectMultiSelectBox = this.selectedRows.length >= this.currentRows.length;

            i = 0;
            while(!this.options.keepSelection && selectMultiSelectBox && i < this.currentRows.length){
                selectMultiSelectBox = ($.inArray(this.currentRows[i += 1][this.identifier], this.selectedRows) !== -1);
            }
            this.$element.find("thead " + selectBoxSelector)
                         .prop("checked", selectMultiSelectBox);

            if(!this.options.multiSelect){
                this.$element.find("tbody > tr " + selectBoxSelector + ":checked")
                             .trigger("click" + namespace);
            }

            for(i = 0; i < this.selectedRows.length; i += 1){
                this.$element.find("tbody > tr[data-row-id=\"" + this.selectedRows[i] + "\"]")
                             .addClass(this.options.css.selected)
                             ._bgAria("selected", "true")
                             .find(selectBoxSelector)
                             .prop("checked", true);
            }

            this.$element.trigger("selected" + namespace, [selectedRows]);
        }
    }
    return this;
};

/**
 * Deselects rows by ids.
 * Deselects all visible rows if no ids are provided.
 * Server-side scenarios only visible rows are deselected.
 * 
 * @method deselect
 * @param [rowIds] {Array} An array of row ids to deselect
 * @chainable
 * @since 1.0.0
 */
Grid.prototype.deselect = function(rowIds){
    if(this.selection){
        rowIds = rowIds || this.currentRows.propValues(this.identifier);

        var id,
            i,
            pos,
            deselectedRows = [];

        while(rowIds.length > 0){
            id = rowIds.pop();
            pos = $.inArray(id, this.selectedRows);
            if(pos !== -1){
                for(i = 0; i < this.currentRows.length; i += 1){
                    if(this.currentRows[i][this.identifier] === id){
                        deselectedRows.push(this.currentRows[i]);
                        this.selectedRows.splice(pos, 1);
                        break;
                    }
                }
            }
        }

        if(deselectedRows.length > 0){
            var selectBoxSelector = getCssSelector(this.options.css.selectBox);

            this.$element.find("thead " + selectBoxSelector).prop("checked", false);
            for(i = 0; i < deselectedRows.length; i += 1){
                this.$element.find("tbody > tr[data-row-id=\"" + deselectedRows[i][this.identifier] + "\"]")
                             .removeClass(this.options.css.selected)
                             ._bgAria("selected", "false")
                             .find(selectBoxSelector)
                             .prop("checked", false);
            }

            this.$element.trigger("deselected" + namespace, [deselectedRows]);
        }
    }
    return this;
};

/**
 * Sorts the rows by a given sort descriptor dictionary.
 * The sort filter will be reset if no argument is provided.
 * 
 * @method sort
 * @param [dictionary] {Object} A sort descriptor dictionary that contains the sort information
 * @chainable
 * @since 1.0.0
 */
Grid.prototype.sort = function(dictionary){
    var values = (dictionary) ? $.extend({}, dictionary) : {};

    if(values === this.sortDictionary){
        return this;
    }

    this.sortDictionary = values;
    renderTableHeader.call(this);
    sortRows.call(this);
    loadData.call(this);
    return this;
};

/**
 * Gets a list of the column settings.
 * This method returns only for the first grid instance a value.
 * Therefore be sure that only one grid instance is caught by your selector.
 * 
 * @method getColumnSettings
 * @return {Array} Returns a list of the column settings
 * @since 1.0.0
 */
Grid.prototype.getColumnSettings = function(){
    return $.merge([], this.columns);
};

/**
 * Gets the current page index.
 * This method returns only for the first grid instance value.
 * Therefore be sure that only one grid instance is caught by your selector.
 * 
 * @method getCurrentPage
 * @return {Number} Returns the current page index
 * @since 1.0.0
 */
Grid.prototype.getCurrentPage = function(){
    return this.current;
};

/**
 * Gets the current rows.
 * This method returns only for the first grid instance a value.
 * Therefore be sure that only one grid instance is caught by your selector.
 *
 * @method getCurrentPage
 * @return {Array} Returns the current rows.
 * @since 1.0.0
 **/
Grid.prototype.getCurrentRows = function()
{
    return $.merge([], this.currentRows);
};

/**
 * Gets a number represents the row count per page.
 * This method returns only for the first grid instance a value.
 * Therefore be sure that only one grid instance is caught by your selector.
 *
 * @method getresultCount
 * @return {Number} Returns the row count per page.
 * @since 1.0.0
 **/
Grid.prototype.getResultCount = function()
{
    return this.resultCount;
};

/**
 * Gets the actual search phrase.
 * This method returns only for the first grid instance a value.
 * Therefore be sure that only one grid instance is caught by your selector.
 *
 * @method getSearchPhrase
 * @return {String} Returns the actual search phrase.
 * @since 1.0.0
 **/
Grid.prototype.getSearchPhrase = function()
{
    return this.searchPhrase;
};

/**
 * Gets the complete list of currently selected rows.
 * This method returns only for the first grid instance a value.
 * Therefore be sure that only one grid instance is caught by your selector.
 *
 * @method getselectedRows
 * @return {Array} Returns all selected rows.
 * @since 1.0.0
 **/
Grid.prototype.getSelectedRows = function()
{
    return $.merge([], this.selectedRows);
};

/**
 * Gets the sort dictionary which represents the state of column sorting.
 * This method returns only for the first grid instance a value.
 * Therefore be sure that only one grid instance is caught by your selector.
 *
 * @method getSortDictionary
 * @return {Object} Returns the sort dictionary.
 * @since 1.0.0
 **/
Grid.prototype.getSortDictionary = function()
{
    return $.extend({}, this.sortDictionary);
};

/**
 * Gets a number represents the total page count.
 * This method returns only for the first grid instance a value.
 * Therefore be sure that only one grid instance is caught by your selector.
 *
 * @method getTotalPageCount
 * @return {Number} Returns the total page count.
 * @since 1.0.0
 **/
Grid.prototype.getTotalPageCount = function()
{
    return this.totalPages;
};

/**
 * Gets a number represents the total row count.
 * This method returns only for the first grid instance a value.
 * Therefore be sure that only one grid instance is caught by your selector.
 *
 * @method getTotalresultCount
 * @return {Number} Returns the total row count.
 * @since 1.0.0
 **/
Grid.prototype.getTotalResultCount = function()
{
    return this.total;
};
