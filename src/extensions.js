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
         return (value) 
                    ? this.attr("aria-" + name, value) 
                    : this.attr("aria-", name);
     },

     /**
      * TODO: Method Documentation
      * @param {Boolean} busy 
      */
     _bgBusyAria: function(busy){
         return (busy === null || busy) 
                    ? this._bgAria("busy", "true") 
                    : this._bgAria("busy", "false");
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
         return (enable === null || enable) 
                    ? this.removeClass("disabled")._bgAria("disabled", "false") 
                    : this.addClass("disabled")._bgAria("disabled", "true");
     },

     /**
      * TODO: Method Documentation
      * @param {Boolean} enable 
      */
     _bgEnableField: function(enable){
         return (enable === null || enable) 
                    ? this.removeAttr("disabled") 
                    : this.attr("disabled", "disable");
     },

     /**
      * TODO: Method Documentation
      * @param {Boolean} show 
      */
     _bgShowAria: function(show){
         return (show === null || show) 
                    ? this.show()._bgAria("hidden", "false") 
                    : this.hide()._bgAria("hidden", "true");
     },

     /**
      * TODO: Method Documentation
      * @param {Boolean} select 
      */
     _bgSelectAria: function(select){
         return (select === null || select) 
                    ? this.addClass("active")._bgAria("selected", "true") 
                    : this.removeClass("active")._bgAria("selected", "false");
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
         return (this.length > skip) 
                    ? (this.length > end) 
                        ? this.slice(skip, end) 
                        : this.slice(skip) 
                    : [];
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