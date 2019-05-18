/*! 
 * jQuery IOTable v1.0.0 - 05/18/2019
 * Copyright (c) 2014-2019 Dalton Brady (https://www.ioflex.net/projects/)
 * Licensed under MIT http://www.opensource.org/licenses/MIT
 */
;(function ($, window, undefined)
{
    /*jshint validthis: true */
    "use strict";

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

        if(!exists(this.rows)){
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
            resultCount: this.resultCount,
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
     * Sets the total rows and total pages.
     * 
     * @method setTotals
     * @param {Numeric} total 
     * @since 1.0.0
     */
    function setTotals(total){
        this.total = total;
        this.totalPages = (this.resultCount === -1) ? 1 : Math.ceil(this.total / this.resultCount);
    }

    /**
     * Prepares the table
     * 
     * @method prepareTable
     * @since 1.0.0
     */
    function prepareTable(){
        var template = this.options.templates,
            wrapper = (this.$element.parent().hasClass(this.options.css.responsiveTable)) ? this.$element.parent() : this.$element;

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
                            e.stopPropagation();
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
                        e.stopPropagation();

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
                var end = (this.current * this.resultCount),
                    infos = $(this.options.templates.infos.resolve(getParams.call(this, {
                        end: (this.total === 0 || end === -1 || end > this.total)? this.total : end,
                        start: (this.total === 0) ? 0 : (end - this.resultCount + 1),
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
                paginationItems = findFooterAndHeaderItems.call(this, selector)._bgShowAria(this.resultCount !== -1);

            if(this.resultCount !== -1 && paginationItems.length > 0){
                var template    = this.options.templates,
                    current     = this.current,
                    totalPages  = this.totalPages,
                    pagination  = $(template.pagination.resolve(getParams.call(this))),
                    offsetRight = totalPages - current,
                    offsetLeft  = (this.options.padding - current) * -1,
                    startWith   = ((offsetRight >= this.options.padding) ? Math.max(offsetLeft, 1) : Math.max((offsetLeft - this.options.padding + offsetRight), 1)),
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
                e.stopPropagation();
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
            resultCountList = this.options.resultCount;

        function getText(value){
            return (value === -1) ? base.options.labels.all : value;
        }

        if($.isArray(resultCountList)){

            var css = this.options.css,
                template = this.options.templates,
                dropDown = $(template.actionDropDown.resolve(getParams.call(this, 
                                                                            { 
                                                                                content: getText(this.resultCount) 
                                                                            }))),
                menuSelector = getCssSelector(css.dropDownMenu),
                menuTextSelector = getCssSelector(css.dropDownMenuText),
                menuItemsSelector = getCssSelector(css.dropDownMenuItems),
                menuItemSelector = getCssSelector(css.dropDownItemButton);

            $.each(resultCountList, function(index, value){
                var item = $(template.actionDropDownItem.resolve(getParams.call(base, 
                                                                                { 
                                                                                    text: getText(value),
                                                                                    action: value 
                                                                                })))
                                                        ._bgSelectAria(value === base.resultCount)
                                                        .on("click" + namespace, menuItemSelector,
                function(e){
                    e.preventDefault();

                    var $this = $(this),
                        newRowCount = $this.data("action");
                    if(newRowCount !== base.resultCount){
                        // TODO: Sophisticated solution needed for calculating which page is selected.
                        base.current = 1; // base.resultCount === -1 (All)
                        base.resultCount = newRowCount;
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
                    rowAttr = " data-row-id=\"" + ((base.identifier == null) ? index : row[base.identifier]) + "\"",
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
                        var value = ($.isFunction(column.formatter)) ? column.formatter.call(base, column, row) : column.converter.to(row[column.id]),
                                    cssClass = (column.cssClass.length > 0) ? " " + column.cssClass : "";

                        cells += template.cell.resolve(getParams.call(base, 
                                                                    { 
                                                                        content: (value === null || value === "") ? "&nbsp;" : value,
                                                                        css: ((column.align === "right") ? css.right : (column.align === "center") ? css.center : css.left) + cssClass,
                                                                        style: (column.width === null) ? "" : "width:" + column.width + ";" 
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
                            e.stopPropagation();

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
                        e.stopPropagation();

                        var $this = $(this),
                            id = (base.identifier === null) ? $this.data("row-id") : base.converter.from($this.data("row-id") + ""),
                            row = (base.identifier === null) ? base.currentRows[id] : base.currentRows.first(function(item){ return item[base.identifier] === id; });

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
                    searchField = ($search.is(searchFieldSelector)) ? $search : $search.find(searchFieldSelector);

                searchField.on("keyup" + namespace, 
                                function(e){
                                    e.stopPropagation();

                                    var newValue = $(this).val();
                                    if(currentValue !== newValue || (e.which === 13 && newValue !== "")){
                                        currentValue = newValue;
                                        if(e.which === 13 || newValue.length === 0 || newValue.length >= base.options.searchSettings.characters){
                                            window.clearTimeout(timer);
                                            timer = window.setTimeout(
                                                function(){
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
            var selectBox = (this.options.multiSelect) ? template.select.resolve(getParams.call(base, { type: "checkbox", value: "all" })) : "";
            html += template.rawHeaderCell.resolve(getParams.call(base, { content: selectBox, css: css.selectCell }));
        }

        $.each(this.columns, function(index, column){
            if(column.visible){
                var sortOrder = base.sortDictionary[column.id],
                    iconCss = ((sorting && sortOrder && sortOrder === "asc") ? css.iconUp : (sorting && sortOrder && sortOrder === "desc") ? css.iconDown : ""),
                    icon = template.icon.resolve(getParams.call(base, { iconCss: iconCss })),
                    align = column.headerAlign,
                    cssClass = (column.headerCssClass.length > 0) ? " " + column.headerCssClass : "";

                html += template.headerCell.resolve(getParams.call(base, { column: column, icon: icon, sortable: sorting && column.sortable && css.sortable || "", css: ((align === "right") ? css.right : (align === "center") ? css.center : css.left) + cssClass, style: (column.width === null) ? "" : "width: " + column.width + ";" }));
            }
        });

        $headerRow.html(html);

        if(sorting){
            var sortingSelector = getCssSelector(css.sortable);

            $headerRow.off("click" + namespace, sortingSelector).on("click" + namespace, sortingSelector, 
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
                        e.stopPropagation();

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
                    padding = (base.$element.height() - $thead.height()) - ($firstCell.height() + 20),
                    count = base.columns.where(isVisible).length;

                if(base.selection){
                    count += 1;
                }

                $tbody.html(template.loading.resolve(getParams.call(base, {columns: count })));

                if(base.resultCount !== -1 && padding > 0){
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

            return (x[item.id] > y[item.id]) ? sortOrder(1) : (x[item.id] < y[item.id]) ? sortOrder(-1) : (sortArray.length > next) ? sort(x, y, next) : 0;
        }

        if(!this.options.ajax){
            var base = this;

            for(var key in this.sortDictionary){
                if(this.options.multiSort || sortArray.length === 0){
                    sortArray.push({ id: key, order: this.sortDictionary[key] });
                }
            }

            if(sortArray.length > 0){
                this.rows.sort(sort);
            }
        }
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
                if(column.searchable && column.visible && column.converter.to(row[column.id]).search(searchPattern) > -1){
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
                        renderNoResultsRow.call(base); // override loading mask
                        base.element._bgBusyAria(false).trigger("loaded" + namespace);
                    }
                }
            };

            settings = $.extend(this.options.ajaxSettings, settings);

            this.xqr = $.ajax(settings);
        }else{
            var rows = (this.searchPhrase.length > 0) ? this.rows.where(containsPhrase) : this.rows,
                total = rows.length;
            
            if(this.resultCount !== -1){
                rows = rows.page(this.current, this.resultCount);
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

    /**
     * jquery-iotable is modeled after jquery-bootgrid
     */

    /**
     * Grid common type extensions.
     */

     $.fn.extend({
         /**
          * TODO: Method Documentation
          * @param {String} name 
          * @param {String} value 
          */
         _bgAria: function(name, value){
             return (value) ? this.attr("aria-" + name, value) : this.attr("aria-", name);
         },

         /**
          * TODO: Method Documentation
          * @param {Boolean} busy 
          */
         _bgBusyAria: function(busy){
             return (busy === null || busy) ? this._bgAria("busy", "true") : this._bgAria("busy", "false");
         },

         /**
          * TODO: Method Documentation
          * @param {String} name
          */
         _bgRemoveAria: function(name){
             return this.removeAttr("aria-" + name);
         },

         /**
          * TODO: Method Documentation
          * @param {Boolean} enable 
          */
         _bgEnableAria: function(enable){
             return (enable === null || enable) ? this.removeClass("disabled")._bgAria("disabled", "false") : this.addClass("disabled")._bgAria("disabled", "true");
         },

         /**
          * TODO: Method Documentation
          * @param {Boolean} enable 
          */
         _bgEnableField: function(enable){
             return (enable === null || enable) ? this.removeAttr("disabled") : this.attr("disabled", "disable");
         },

         /**
          * TODO: Method Documentation
          * @param {Boolean} show 
          */
         _bgShowAria: function(show){
             return (show === null || show) ? this.show()._bgAria("hidden", "false") : this.hide()._bgAria("hidden", "true");
         },

         /**
          * TODO: Method Documentation
          * @param {Boolean} select 
          */
         _bgSelectAria: function(select){
             return (select === null || select) ? this.addClass("active")._bgAria("selected", "true") : this.removeClass("active")._bgAria("selected", "false");
         },

         /**
          * TODO: Method Documentation
          * @param {Numeric} id 
          */
         _bgId: function(id){
             return (id) ? this.attr("id", id) : this.attr("id");
         }
     });

     if(!String.prototype.resolve){
         
        var formatter = {
            "checked": function(value){
                if(typeof value === "boolean"){
                    return (value) ? "checked=\"checked\"" : "";
                }
                return value;
            }
        };

        String.prototype.resolve = function(substitutes, prefixes){

            var base = this;

            $.each(substitutes, function(key, value){
                if(value !== null && typeof value !== "function"){
                    if(typeof value === "object"){
                        var keys = (prefixes) ? $.extend([], prefixes) : [];
                        keys.push(key);
                        base = base.resolve(value, keys) + "";
                    }else{
                        if(formatter && formatter[key] && typeof formatter[key] === "function"){
                            value = formatter[key](value);
                        }
                        key =  (prefixes) ? prefixes.join(".") + "." + key : key;
                        var pattern = new RegExp("\\{\\{" + key + "\\}\\}", "gm");
                        base = base.replace(pattern, (value.replace) ? value.replace(/\$/gi, "&#36;") : value);
                    }
                }
            });
            return base;
        };
     }

     if(!Array.prototype.first){
         Array.prototype.first = function(condition){
             for(var i = 0; i< this.length; i += 1){
                 var item = this[i];
                 if(condition(item)){
                     return item;
                 }
             }
             return null;
         };
     }

     if(!Array.prototype.page){
         Array.prototype.page = function(page, size){
             var skip = (page - 1) * size,
                 end = skip + size;
             return (this.length > skip) ? (this.length > end) ? this.slice(skip, end) : this.slice(skip) : [];
         };
     }

     if(!Array.prototype.where){
         Array.prototype.where = function(condition){
             var result = [];
             for(var i = 0; i < this.length; i += 1){
                 var item = this[i];
                 if(condition(item)){
                     result.push(item);
                 }
             }
             return result;
         };
     }

     if(!Array.prototype.propValues){
         Array.prototype.propValues = function(propName){
             var result = [];
             for(var i = 0; i < this.length; i += 1){
                 result.push(this[i][propName]);
             }
             return result;
         };
     }

    /**
     * jquery-iotable is modeled after jquery-bootgrid
     */

    /**
     * Grid Plugin Definition
     */


    var old = $.fn.iotable;

    $.fn.iotable = function(option){

        var args = Array.prototype.slice.call(arguments, 1),
            returnValue = null,
            elements = this.each(function(index)
            {
                var $this = $(this),
                    instance = $this.data(namespace),
                    options = typeof option === "object" && option;

                if(!instance && option === "destroy"){
                    return;
                }

                if(!instance){
                    $this.data(namespace, (instance = new Grid(this, options)));
                    init.call(instance);
                }

                if(typeof option === "string"){
                    if(option.indexOf("get") === 0 && index === 0){
                        returnValue = instance[option].apply(instance, args);
                    }else if(option.indexOf("get") !== 0){
                        return instance[option].apply(instance, args);
                    }
                }
            });
        return (typeof option === "string" && option.indexOf("get") === 0) ? returnValue : elements;
    };

    /**
     * Constructor
     */
    $.fn.iotable.Constructor = Grid;

    /**
     * Grid no conflict
     */
    $.fn.iotable.noConflict = function(){
        $.fn.iotable = old;
        return this;
    };

    /**
     * Grid data-api
     */
$("[data-toggle=\"iotable\"]").iotable();
})(jQuery, window);