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

