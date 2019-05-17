/**
 * jquery-iotable is modeled after jquery-bootgrid
 */

/**
 * Grid Internal Properties
 */

var namespace = ".ioflex.jquery.iotable";

/**
 * Grid Internal Functions
 */

/**
 * Append row to grid
 * 
 * @method appendRow
 * @param row
 * @since 1.0.0
 */
function appendRow(row){
    var base = this;

    function exists(item){
        return base.identifier && item[base.identifier] === row[base.identifier];
    }

    if(!this.rows.contains(exists)){
        this.rows.push(row);
        return true;
    }
    return false;
}

/**
 * Finds the header and footer items by css selector.
 * 
 * @method findFooterAndHeaderItems
 * @param selector {String} Css selector
 * @since 1.0.0
 */
function findFooterAndHeaderItems(selector){
    var footer = (this.footer) ? this.footer.find(selector) : $(),
        header = (this.header) ? this.header.find(selector) : $();
    return $.merge(footer, header);
}

/**
 * Get grid parameters.
 * 
 * @method getParams
 * @param context
 * @since 1.0.0
 */
function getParams(context){
    return (context) ? $.extend({}, this.cachedParams, { ctx: context }) : this.cachedParams;
}

/**
 * Gets a request.
 * 
 * @method getRequest
 * @since 1.0.0
 */
function getRequest(){
    var request = {
        current: this.current,
        rowCount: this.rowCount,
        sort: this.sortDictionary,
        searchPhrase: this.searchPhrase
    },
    post = this.options.post;

    post = ($.isFunction(post)) ? post() : post;
    return this.options.requestHandler($.extend(true, request, post));
}

/**
 * Gets a css selector.
 * 
 * @method getCssSelector
 * @param root selector
 * @since 1.0.0
 */
function getCssSelector(css){
    return "." + $.trim(css).replace(/\s+/gm, ".");
}

/**
 * Gets the AJAX url.
 * 
 * @method getUrl
 * @since 1.0.0
 */
function getUrl(){
    var url = this.options.url;
    return ($.isFunction(url)) ? url() : url;
}

/**
 * Initialize the iotable.
 * 
 * @method init
 * @since 1.0.0
 */
function init(){
    this.$element.trigger("initialize" + namespace);

    /**
     * Loads columns from HTML `thead` tag.
     */
    loadColumns.call(this);

    this.selection = this.options.selection && this.identifier !== null;

    /**
     * Loads rows from HTML `tbody` tag if ajax is false.
     */
    loadRows.call(this);

    prepareTable.call(this);

    renderTableHeader.call(this);

    renderSearchField.call(this);

    renderActions.call(this);

    loadData.call(this);

    this.$element.trigger("initialized" + namespace);
}

/**
 * Highlights appended rows
 * 
 * @method highlightAppendedRows
 * @param {Array} rows
 * @since 1.0.0
 */
function highlightAppendedRows(rows){
    if(this.options.highlightRows){
        // TODO: Implement this functionallity.
    }
}

/**
 * Check if a column is visible.
 * 
 * @method isVisible
 * @param {Object} column
 * @since 1.0.0
 */
function isVisible(column){
    return column.visible;
}

/**
 * Load columns into table.
 * 
 * @method loadColumns
 * @since 1.0.0
 */
function loadColumns(){
    var base = this,
        firstHeadRow = this.$element.find("thead > tr").first(),
        sorted = false;

    /*jshint -W018*/
    firstHeadRow.children().each(function(){
        var $this = $(this),
            data = $this.data(),
            column = {
                id: data.columnId,
                identifier: base.identifier === null && data.identifier || false,
                converter: base.options.converters[data.converter || data.type] || base.options.converters["string"],
                text: $this.text(),
                align: data.align || "left",
                headerAlign: data.headerAlign || "left",
                cssClass: data.cssClass || "",
                headerCssClass: data.headerCssClass || "",
                formatter: base.options.formatters[data.formatter] || null,
                order: (!sorted && (data.order === "asc" || data.order === "desc")) ? data.order : null,
                searchable: !(data.searchable === false), // default: true
                sortable: !(data.sortable === false), // default: true
                visible: !(data.visible === false), // default: true
                visibleInSelection: !(data.visibleInSelection === false), // default: true
                width: ($.isNumeric(data.width)) ? data.width + "px" : (typeof(data.width) === "string") ? data.width : null
            };
        
        base.columns.push(column);

        if(column.order !== null){
            base.sortDictionary[column.id] = column.order;
        }

        // *** Prevent multiple identifiers ***
        if(column.identifier){
            base.identifier = column.id;
            base.converter  = column.converter;
        }

        // *** Ensure that only the first order will be applied in the case that multi-sorting is disabled ***
        if(!base.options.multiSort && column.order !== null){
            sorted = true;
        }
    });
    /*jshint -W018*/
}

/**
 * Load data into table
 * 
 * @method loadData
 * @since 1.0.0
 */
function loadData(){
    var base = this;

    this.$element._bgBusyAria(true).trigger("load" + namespace);
    showLoading.call(this);

    function containsPhrase(row){
        var column,
            searchPattern = new RegExp(base.searchPhrase, (base.options.caseSensitive) ? "g" : "gi");
        
        for(var i = 0; i < base.columns.length; i += 1){
            column = base.columns[i];
            if(column.searchable 
                && column.visible 
                && column.converter.to(row[column.id]).search(searchPattern) > -1){
                return true;
            }
        }
        return false;
    }

    function update(rows, total){
        base.currentRows = rows;
        setTotals.call(base, total);

        if(!base.options.keepSelection){
            base.selectedRows = [];
        }

        renderRows.call(base, rows);
        renderInfos.call(base);
        renderPagination.call(base);

        base.$element._bgBusyAria(false).trigger("loaded" + namespace);
    }

    if(this.options.ajax){
        var request = getRequest.call(this),
            url = getUrl.call(this);

        if(url === null || typeof url !== "string" || url.length === 0){
            throw new Error("Url setting must be a non-empty string or a function that returns one.");
        }

        // *** Abort the previous AJAX request if not already finished or if failed.
        if(this.xqr){
            this.xqr.abort();
        }

        var settings = {
            url: url,
            data: request,
            success: function(response){
                base.xqr = null;

                if(typeof (response) === "string"){
                    response = $.parseJSON(response);
                }

                response = base.options.responseHandler(response);

                base.current = response.current;
                update(response.rows, response.totals);
            },
            error: function(jqXHR, textStatus, errorThrown){
                base.xqr = null;

                if(textStatus !== "abort"){
                    renderNoResultsRow.call(base) // override loading mask
                    base.element._bgBusyAria(false).trigger("loaded" + namespace);
                }
            }
        };

        settings = $.extend(this.options.ajaxSettings, settings);

        this.xqr = $.ajax(settings);
    }else{
        var rows = (this.searchPhrase.length > 0) ? this.rows.where(containsPhrase) : this.rows,
            total = rows.length;
        
        if(this.rowCount !== -1){
            rows = rows.page(this.current, this.rowCount);
        }

        // TODO: Improve this comment ?
        // *** setTimeout decouples the initialization so that adding event handlers happens before initialization ***
        window.setTimeout(function() {update(rows, total);}, 10);
    }
}

/**
 * Load rows when not using AJAX.
 * 
 * @method loadRows
 * @since 1.0.0
 */
function loadRows(){
    if(!this.options.ajax){
        var base = this,
            rows = this.$element.find("tbody > tr");

        rows.each(function(){
            var $this = $(this),
                cells = $this.children("td"),
                row = {};

            $.each(base.columns, function(i, column){
                row[column.id] = column.converter.from(cells.eq(i).text());
            });

            appendRow.call(base, row);
        });

        setTotals.call(this, this.rows.length);
        sortRows.call(this);
    }
}

/**
 * Sets the total rows and total pages.
 * 
 * @method setTotals
 * @param {Numeric} total 
 * @since 1.0.0
 */
function setTotals(total){
    this.total = total;
    this.totalPages = (this.rowCount === -1) ? 1 : Math.ceil(this.total / this.rowCount);
}

/**
 * Prepares the table
 * 
 * @method prepareTable
 * @since 1.0.0
 */
function prepareTable(){
    var template = this.options.templates,
        wrapper = (this.$element.parent().hasClass(this.options.css.responsiveTable)) 
                    ? this.$element.parent() 
                    : this.$element;

    this.$element.addClass(this.options.css.table);

    // *** Check whether there is a(n) tbody element, if not create one ***
    if(this.$element.children("tbody").length === 0){
        this.$element.append(template.body);
    }

    if(this.options.navigation & 1){
        this.header = $(template.header.resolve(getParams.call(this, {id: this.$element._bgId() + "-header"})));
        wrapper.before(this.header);
    }

    if(this.options.navigation & 2){
        this.footer = $(template.footer.resolve(getParams.call(this, {id: this.$element._bgId() + "-footer"})));
        wrapper.after(this.footer);
    }
}

/**
 * Render the actions for the table.
 * 
 * @method renderAction
 * @since 1.0.0
 */
function renderActions(){
    if(this.options.navigation !== 0){
        var css = this.options.css,
            selector = getCssSelector(css.actions),
            actionItems = findFooterAndHeaderItems.call(this, selector);

        if(actionItems.length > 0){
            var base = this,
                template = this.options.templates,
                actions = $(template.actions.resolve(getParams.call(this)));

            // *** Refresh Button ***
            if(this.options.ajax){
                var refreshIcon = template.icon.resolve(getParams.call(this, {iconCss: css.iconRefresh})),
                    refresh = $(template.actionButton.resolve(getParams.call(this, {
                        content: refreshIcon,
                        text: this.options.labels.refresh
                    }))).on("click" + namespace, function(e){
                        // TODO: Prevent multiple fast clicks (fast click detection)
                        e.stopPropogation();
                        base.current = 1;
                        loadData.call(base);
                    });
                actions.append(refresh);
            }

            // *** Row count selection ***
            renderRowCountSelection.call(this, actions);

            // *** Column selection ***
            renderColumnSelection.call(this, actions);

            replacePlaceHolder.call(this, actionItems, actions);
        }
    }
}

/**
 * Renders column selection dropdown list element.
 * 
 * @method renderColumnSelection
 * @param {*} actions 
 * @since 1.0.0
 */
function renderColumnSelection(actions){
    if(this.options.columnSelection && this.columns.length > 1){
        var base = this,
            css = this.options.css,
            template = this.options.templates,
            icon = template.icon.resolve(getParams.call(this, {iconCss: css.iconColumns})),
            dropDown = $(template.actionDropDown.resolve(getParams.call(this, {content: icon}))),
            selector = getCssSelector(css.dropDownItem),
            checkboxSelector = getCssSelector(css.dropDownItemCheckbox),
            itemsSelector = getCssSelector(css.dropDownMenuItems);

        $.each(this.columns, function(i, column){
            if(column.visibleInSelection){
                var item = $(template.actionDropDownCheckboxItem.resolve(getParams.call(base,{
                    name: column.id,
                    label: column.text,
                    checked: column.visible
                }))).on("click" + namespace, selector, function(e){
                    e.stopPropogation();

                    var $this = $(this),
                        checkbox = $this.find(checkboxSelector);
                    if(!checkbox.prop("disabled")){
                        column.visible = checkbox.prop("checked");
                        var enable = base.columns.where(isVisible).length > 1;
                        $this.parents(itemsSelector).find(selector + ":has(" + checkboxSelector + ":checked)")
                                                    ._bgEnableAria(enable)
                                                    .find(checkboxSelector)
                                                    ._bgEnableField(enable);

                        base.$element.find("tbody").empty(); // Fixes column visualization bug
                        renderTableHeader.call(base);
                        loadData.call(base);
                    }
                });
                dropDown.find(getCssSelector(css.dropDownMenuItems)).append(item);
            }
        });
        actions.append(dropDown);
    }
}

/**
 * Render infos elements below the table.
 * 
 * @method renderInfos
 * @since 1.0.0
 */
function renderInfos(){
    if(this.options.navigation !== 0){
        var selector = getCssSelector(this.options.css.infos),
            infoItems = findFooterAndHeaderItems.call(this, selector);

        if(infoItems.length > 0){
            var end = (this.current * this.rowCount),
                infos = $(this.options.templates.infos.resolve(getParams.call(this, {
                    end: (this.total === 0 || end === -1 || end > this.total)
                             ? this.total 
                             : end,
                    start: (this.total === 0) ? 0 : (end - this.rowCount + 1),
                    total: this.total
                })));

            replacePlaceHolder.call(this, infoItems, infos);
        }
    }
}

/**
 * Render the no results returned row within the tbody.
 * 
 * @method renderNoResultsRow
 * @since 1.0.0
 */
function renderNoResultsRow(){
    var tbody = this.$element.children("tbody").first(),
        template = this.options.templates,
        count = this.columns.where(isVisible).length;

    if(this.selection){
        count += 1;
    }

    tbody.html(template.noResults.resolve(getParams.call(this, {columns: count})));
}

/**
 * Renders pagination elements below the table.
 * 
 * @method renderPagination
 * @since 1.0.0
 */
function renderPagination(){
    if(this.options.navigation !== 0){
        var selector = getCssSelector(this.options.css.infos),
            paginationItems = findFooterAndHeaderItems.call(this, selector)._bgShowAria(this.rowCount !== -1);

        if(this.rowCount !== -1 && paginationItems.length > 0){
            var template    = this.options.templates,
                current     = this.current,
                totalPages  = this.totalPages,
                pagination  = $(template.pagination.resolve(getParams.call(this))),
                offsetRight = totalPages - current;
                offsetLeft  = (this.options.padding - current) * -1,
                startWith   = ((offsetRight >= this.options.padding) 
                                ? Math.max(offsetLeft, 1) 
                                : Math.max((offsetLeft - this.options.padding + offsetRight), 1)),
                maxCount    = this.options.padding * 2 + 1,
                count       = (totalPages >= maxCount) ? maxCount : totalPages;

            renderPaginationItem.call(this, pagination, "first", "&laquo;", "first")
                                ._bgEnableAria(current > 1);

            renderPaginationItem.call(this, pagination, "prev", "&lt;", "prev")
                                ._bgEnableAria(current > 1);

            for(var i = 0; i < count; i += 1){
                var pos = i + startWith;
                renderPaginationItem.call(this, pagination, pos, pos, "page-" + pos)
                                    ._bgEnableAria()
                                    ._bgSelectAria(pos === current);
            }

            if(count === 0){
                renderPaginationItem.call(this, pagination, 1, 1, "page-" + 1)
                                    ._bgEnableAria(false)
                                    ._bgSelectAria();
            }

            renderPaginationItem.call(this, pagination, "next", "&gt;", "next")
                                ._bgEnableAria(totalPages > current);

            renderPaginationItem.call(this, pagination, "last", "&raquo;", "last")
                                ._bgEnableAria(totalPages > current);

            replacePlaceHolder.call(this, paginationItems, pagination);
        }
    }
}

/**
 * Render pagination items below the table.
 * 
 * @method renderPaginationItem
 * @param {*} list 
 * @param {*} page 
 * @param {*} text 
 * @param {*} markerCss 
 * @since 1.0.0
 */
function renderPaginationItem(list, page, text, markerCss){
    var base = this,
        template = this.options.templates,
        css = this.options.css,
        values = getParams.call(this, {css: markerCss, text: text, page: page}),
        item = $(template.paginationItem.resolve(values)).on("click" + namespace, getCssSelector(css.paginationButton), function(e){
            e.stopPropogation();
            e.preventDefault();

            var $this = $(this),
                parent = $this.parent();

            if(!parent.hasClass("active") && !parent.hasClass("disabled")){
                var commandList = {
                    first: 1,
                    prev: base.current -1,
                    next: base.current +1,
                    last: base.totalPages
                };
                var command = $this.data("page");
                base.current = commandList[command] || command;
                loadData.call(base);
            }
            $this.trigger("blur");
        });
    list.append(item);
    return item;
}

/**
 * Render row count selection elements?
 * 
 * @method renderRowCountSelection
 * @param {*} actions 
 * @since 1.0.0
 */
function renderRowCountSelection(actions){
    var base = this,
        rowCountList = this.options.rowCount;

    function getText(value){
        return (value === -1) ? base.options.labels.all : value;
    }

    if($.isArray(rowCountList)){

        var css = this.options.css,
            template = this.options.templates,
            dropDown = $(template.actionDropDown.resolve(getParams.call(this, 
                                                                        { 
                                                                            content: getText(this.rowCount) 
                                                                        }))),
            menuSelector = getCssSelector(css.dropDownMenu),
            menuTextSelector = getCssSelector(css.dropDownMenuText),
            menuItemsSelector = getCssSelector(css.dropDownMenuItems),
            menuItemSelector = getCssSelector(css.dropDownItemButton);

        $.each(rowCountList, function(index, value){
            var item = $(template.actionDropDownItem.resolve(getParams.call(base, 
                                                                            { 
                                                                                text: getText(value),
                                                                                action: value 
                                                                            })))
                                                    ._bgSelectAria(value === base.rowCount)
                                                    .on("click" + namespace, menuItemSelector,
            function(e){
                e.preventDefault();

                var $this = $(this),
                    newRowCount = $this.data("action");
                if(newRowCount !== base.rowCount){
                    // TODO: Sophisticated solution needed for calculating which page is selected.
                    base.current = 1; // base.rowCount === -1 (All)
                    base.rowCount = newRowCount;
                    $this.parents(menuItemSelector).children().each(function(){
                        var $item = $(this),
                            currentRowCount = $item.find(menuItemSelector).data("action");
                        $item._bgSelectAria(currentRowCount === newRowCount);
                    });
                }
            });
            dropDown.find(menuItemsSelector).append(item);
        });
        actions.append(dropDown);
    }
}

/**
 * Render the rows of the table.
 * 
 * @method renderRows
 * @param {*} rows 
 * @since 1.0.0
 */
function renderRows(rows){
    if(rows.length > 0){
        var base = this,
            css = this.options.css,
            template = this.options.templates,
            $tbody = this.$element.children("tbody").first(),
            allRowsSelected = true,
            html = "";

        $.each(rows, function(index, row){
            var cells = "",
                rowAttr = " data-row-id=\"" + ((base.identifier == null) 
                                                ? index 
                                                : row[base.identifier]) + "\"",
                rowCss = "";

            if(base.selection){
                var selected = ($.inArray(row[base.identifier], base.selectedRows) !== -1),
                    selectBox = template.select.resolve(getParams.call(base, 
                                                                        { 
                                                                            type: "checkbox",
                                                                            value: row[base.identifier],
                                                                            checked: selected
                                                                        }));

                cells += template.cell.resolve(getParams.call(base, { content: selectBox, css: css.selectCell }));
                allRowsSelected = (allRowsSelected && selected);

                if(selected){
                    rowCss += css.selected;
                    rowAttr += " aria-selected\"true\"";
                }
            }

            var status = row.status !== null && base.options.statusMapping[row.status];

            if(status){
                rowCss += status;
            }

            $.each(base.columns, function(j, column){
                if(column.visible){
                    var value = ($.isFunction(column.formatter)) 
                                    ? column.formatter.call(base, column, row) 
                                    : column.converter.to(row[column.id]),
                                cssClass = (column.cssClass.length > 0) ? " " + column.cssClass : "";

                    cells += template.cell.resolve(getParams.call(base, 
                                                                { 
                                                                    content: (value === null || value === "") 
                                                                                ? "&nbsp;" 
                                                                                : value,
                                                                    css: ((column.align === "right") 
                                                                                ? css.right 
                                                                                : (column.align === "center") 
                                                                                    ? css.center : css.left) + cssClass,
                                                                    style: (column.width === null) 
                                                                                ? "" 
                                                                                : "width:" + column.width + ";" 
                                                                }));
                }
            });

            if(rowCss.length > 0){
                rowAttr += " class=\"" + rowCss + "\"";
            }

            html += template.row.resolve(getParams.call(base, 
                                                        {
                                                            attr: rowAttr,
                                                            cells: cells
                                                        }));
        });

        /**
         * Set or clear multi-select box state.
         */
        base.$element.find("thead " + getCssSelector(base.options.css.selectBox))
                     .prop("checked", allRowsSelected);

        $tbody.html(html);

        registerRowEvents.call(this, $tbody);
    }else{
        renderNoResultsRow.call(this);
    }
}

/**
 * Register row events.
 * 
 * @method registerRowEvents
 * @param {*} tbody 
 * @since 1.0.0
 */
function registerRowEvents(tbody){

    var base = this,
        selectBoxSelector = getCssSelector(this.options.css.selectBox);

    if(this.selection){
        tbody.off("click" + namespace, selectBoxSelector)
             .on("click" + namespace, selectBoxSelector, 
                    function(e){
                        e.stopPropogation();

                        var $this = $(this),
                            id = base.converter.from($this.val());

                        if($this.prop("checked")){
                            base.select([id]);
                        }else{
                            base.deselect([id]);
                        }
                    });
    }

    tbody.off("click" + namespace, "> tr")
         .on("click" + namespace, "> tr", 
                function(e){
                    e.stopPropogation();

                    var $this = $(this),
                        id = (base.identifier === null) 
                                ? $this.data("row-id") 
                                : base.converter.from($this.data("row-id") + ""),
                        row = (base.identifier === null) 
                                ? base.currentRows[id] 
                                : base.currentRows.first(function(item){ return item[base.identifier] === id; });

                    if(base.selection && base.options.rowSelect){
                        if($this.hasClass(base.options.css.selected)){
                            base.deselect([id]);
                        }else{
                            base.select([id]);
                        }
                    }

                    base.$element.trigger("click" + namespace, [base.columns, row]);
                });
}

/**
 * Render the search field element.
 * 
 * @method renderSearchField
 * @since 1.0.0
 */
function renderSearchField(){
    if(this.options.navigation !== 0){
        var css = this.options.css,
            selector = getCssSelector(css.search),
            searchItems = findFooterAndHeaderItems.call(this, selector);

        if(searchItems.length > 0){
            var base = this,
                template = this.options.templates,
                timer = null, // *** Fast keyup detection ***
                currentValue = "",
                searchFieldSelector = getCssSelector(css.searchField),
                $search = $(template.search.resolve(getParams.call(this))),
                searchField = ($search.is(searchFieldSelector)) 
                                ? $search 
                                : $search.find(searchFieldSelector);

            searchField.on("keyup" + namespace, 
                            function(e){
                                e.stopPropogation();

                                var newValue = $(this).val();
                                if(currentValue !== newValue || (e.which === 13 && newValue !== "")){
                                    currentValue = newValue;
                                    if(e.which === 13 || newValue.length === 0 || newValue.length >= base.options.searchSettings.characters){
                                        window.clearTimeout(timer);
                                        timer = window.setTimeout(function(){
                                            executeSearch.call(base, newValue);
                                        }, base.options.searchSettings.delay);
                                    }
                                }
                            });
            replacePlaceHolder.call(this, searchItems, $search);
        }
    }
}

/**
 * Execute a search on the table / server-side api endpoint.
 * 
 * @method executeSearch
 * @param {String} phrase - phrase to search table / server-side data for.
 * @since 1.0.0
 */
function executeSearch(phrase){
    if(this.searchPhrase !== phrase){
        this.current = 1;
        this.searchPhrase = phrase;
        loadData.call(this);
    }
}

/**
 * Render the Table header row.
 * 
 * @method renderTableHeader
 * @since 1.0.0
 */
function renderTableHeader(){

    var base = this,
        $headerRow = this.$element.find("thead > tr"),
        css = this.options.css,
        template = this.options.templates,
        html = "",
        sorting = this.options.sorting;

    if(this.selection){
        var selectBox = (this.options.multiSelect) 
                            ? template.select.resolve(getParams.call(base, 
                                                                        { 
                                                                            type: "checkbox",
                                                                             value: "all" 
                                                                        })) 
                            : "";
        html += template.rawHeaderCell.resolve(getParams.call(base, 
                                                                { 
                                                                    content: selectBox, 
                                                                    css: css.selectCell 
                                                                }));
    }

    $.each(this.columns, function(index, column){
        if(column.visible){
            var sortOrder = base.sortDictionary[column.id],
                iconCss = ((sorting && sortOrder && sortOrder === "asc") 
                            ? css.iconUp 
                            : (sorting && sortOrder && sortOrder === "desc") 
                                ? css.iconDown 
                                : ""),
                icon = template.icon.resolve(getParams.call(base, 
                                                            {
                                                                 iconCss: iconCss 
                                                            })),
                align = column.headerAlign,
                cssClass = (column.headerCssClass.length > 0) 
                                ? " " + column.headerCssClass 
                                : "";

            html += template.headerCell.resolve(getParams.call(base, 
                                                                {
                                                                    column: column,
                                                                    icon: icon, 
                                                                    sortable: sorting && column.sortable && css.sortable || "",
                                                                    css: ((align === "right") 
                                                                            ? css.right 
                                                                            : (align === "center") 
                                                                                ? css.center 
                                                                                : css.left) + cssClass,
                                                                    style: (column.width === null) 
                                                                                ? "" 
                                                                                : "width: " + column.width + ";"
                                                                }));
        }
    });

    $headerRow.html(html);

    if(sorting){
        var sortingSelector = getCssSelector(css.sortable);

        $headerRow.off("click" + namespace, sortingSelector)
                  .on("click" + namespace, sortingSelector, 
                        function(e){
                            e.preventDefault();

                            setTableHeaderSortDirection.call(base, $(this));
                            sortRows.call(base);
                            loadData.call(base);
                        });
    }

    // TODO: Create a seperate function for this piece of code.
    if(this.selection && this.options.multiSelect){
        var selectBoxSelector = getCssSelector(css.selectBox);
        $headerRow.off("click" + namespace, selectBoxSelector)
                  .on("click" + namespace, selectBoxSelector, 
                  function(e){
                    e.stopPropogation();

                    if($(this).prop("checked")){
                        base.select();
                    }else{
                        base.deselect();
                    }
                });
    }
}

/**
 * Style the Header cell sort direction with an arrow or something.
 * 
 * @method setTableHeaderSortDirection
 * @param {Object | Table Header element reference} element 
 * @since 1.0.0
 */
function setTableHeaderSortDirection(element){
    var css = this.options.css,
        iconSelector = getCssSelector(css.icon),
        columnId = element.data("column-id") || element.parents("th").first().data("column-id"),
        sortOrder = this.sortDictionary[columnId],
        icon = element.find(iconSelector);

    if(!this.options.multiSort){
        element.parents("tr").first().find(iconSelector).removeClass(css.iconDown + " " + css.iconUp);
        this.sortDictionary = {};
    }

    if(sortOrder &&  sortOrder === "asc"){
        this.sortDictionary[columnId] = "desc";
        icon.removeClass(css.iconUp).addClass(css.iconDown);
    }else if(sortOrder && sortOrder === "desc"){
        if(this.options.multiSort){
            var newSort = {};
            for(var key in this.sortDictionary){
                if(key !== columnId){
                    newSort[key] = this.sortDictionary[key];
                }
            }
            this.sortDictionary = newSort;
            icon.removeClass(css.iconDown);
        }else{
            this.sortDictionary[columnId] = "asc";
            icon.removeClass(css.iconDown).addClass(css.iconUp);
        }
    }else{
        this.sortDictionary[columnId] = "asc";
        icon.addClass(css.iconUp);
    }
}

/**
 * TODO: Method documentation
 * 
 * @method replacePlaceHolder
 * @param {*} placeHolder 
 * @param {*} element 
 * @since 1.0.0
 */
function replacePlaceHolder(placeHolder, element){
    placeHolder.each(function(index, item){
        // TODO: Check how append is implemented. Cloning may be superfluous.
        $(item).before(element.clone(true)).remove();
    });
}

/**
 * TODO: Method Documentation
 * 
 * @method showLoading
 * @since 1.0.0
 */
function showLoading(){
    var base = this;

    window.setTimeout(function(){
        if(base.$element._bgAria("busy") === "true"){
            var template = base.options.templates,
                $thead = base.$element.children("thead").first(),
                $tbody = base.$element.children("tbody").first(),
                $firstCell = $tbody.find("tr > td").first(),
                padding = (base.$element.height() = $thead.height()) - ($firstCell.height() + 20),
                count = base.columns.where(isVisible).length;

            if(base.selection){
                count += 1;
            }

            $tbody.html(template.loading.resolve(getParams.call(base, 
                                                                    {
                                                                        columns: count
                                                                    })));

            if(base.rowCount !== -1 && padding > 0){
                $tbody.find("tr > td").css("padding", "20px 0" + padding + "px");
            }
        }
    }, 250);
}

/**
 * TODO: Method Documentation
 * 
 * @method sortRows
 * @since 1.0.0
 */
function sortRows(){

    var sortArray = [];

    function sort(x, y, current){
        current = current || 0;

        var next = current + 1,
            item = sortArray[current];

        function sortOrder(value){
            return (item.order === "asc") ? value : value * -1;
        }

        return (x[item.id] > y[item.id]) 
                    ? sortOrder(1) 
                    : (x[item.id] < y[item.id]) 
                        ? sortOrder(-1) 
                        : (sortArray.length > next) 
                            ? sort(x, y, next) 
                            : 0;
    }

    if(!this.options.ajax){
        var base = this;

        for(var key in this.sortDictionary){
            if(this.options.multiSort || sortArray.length === 0){
                sortArray.push(
                    {
                        id: key,
                        order: this.sortDictionary[key]
                    });
            }
        }

        if(sortArray.length > 0){
            this.rows.sort(sort);
        }
    }
}



