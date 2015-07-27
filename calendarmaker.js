/*!
 * Basic Calendar Maker v0.0.1
 *
 * Copyright Constellation Web Services, LLC
 * http://www.constellationwebservices.com
 * 
 * Released under the MIT license
 * https://github.com/motivatedsloth/jquery-restful/blob/master/LICENSE
 *
 */

/**
 * jQuery plug to make simple calendars
 * @param {type} $
 * @returns {undefined}
 */
;(function($){
    
    function calendarmaker($element, opts){
    
        //containers
        var $calendar,
        $control,
        //modules
        dsp,
        ctl;

        //options
        var options = {}, 
        default_options = {
            months: ['January','February','March','April','May','June','July','August','September','October','November','December'],
            control_container: '<div class="calendar-control"></div>',
            calendar_container: '<div class="calendar-display"></div>',
            onUpdate: function(){}
        };
        $.extend(true, options, default_options, opts);

        dsp = new display(options);
        
        ctl = new control(options);
        ctl.on("update", displayCalendar);
        ctl.on("update", options.onUpdate);
        
        //create and insert containers
        $calendar = $(options.calendar_container);
        $control = $(options.control_container);
        $element.append($control, $calendar);
        
        //init control when everything is ready
        $control.append(ctl.init());
        
        /**
         * display calendar
         * @param {Date} dt
         * @returns {undefined}
         */
        function displayCalendar(dt){
            $calendar.empty();
            var interval = ctl.options("interval");
            switch(interval.substr(-1)){
                case "M":
                    $calendar.append(dsp.month(dt));
                    break;
                case "Y":
                    $calendar.append(dsp.year(dt));
                    break;
                case "D":
                    for(var num = interval.substr(0, interval.length - 1); num > 0; num-- ){
                        $calendar.append(dsp.day(dt));
                        dt.setDate(dt.getDate() + 1);
                    }
                    break;
            }
        }
        
        return {
            on: function(ident, fn){
                dsp.on(ident, fn);
                ctl.on(ident, fn);
            },
            off: function(ident, fn){
                dsp.off(ident, fn);
                ctl.off(ident, fn);
            },
            goTo: ctl.goTo
        };
        
    };//calendar maker
    
    /**
     * calendar creator
     * 
     * @param {jQuery} $ bind jQuery to $
     * @type Function|town_L354.townAnonym$4
     */
    function display(opts){
        var options = {},
        default_options =
        {
            year_template: '<div class="calendar-year"></div>',
            month_template: '<div class="calendar-month"><span class="calendar-month-name">{name}</span></div>',
            header_template: '<div class="calendar-header"></div>',
            weekday_template: '<div class="calendar-weekday"></div>',
            week_template: '<div class="calendar-week"></div>',
            day_template: '<div class="calendar-day"></div>',
            date_template: '<div class="calendar-date"><span class="calendar-date-string">{string}</span> <span  class="calendar-date-number">{number}</span></div>',
            weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        },
        callbacks = {
            yearBefore: $.Callbacks(),
            yearAfter: $.Callbacks(),
            monthBefore: $.Callbacks(),
            monthAfter: $.Callbacks(),
            weekBefore: $.Callbacks(),
            weekAfter: $.Callbacks(),
            dayBefore: $.Callbacks(),
            dayAfter: $.Callbacks()
        };

        $.extend(options, default_options, opts);

        /**
         * build year
         * @param {Date} set to year and month to start
         * @returns {jQuery|""}
         */
        function buildYear(year){
            if(!year){
                year = new Date();
            }
            year.setMonth(0);
            callbacks.yearBefore.fire( year );
            var $year = $(options.year_template);
            
            for(var x = 0; x < 12; x++){
                $year.append(buildMonth(year));
            }

            callbacks.yearAfter.fire( $year, year );
            return $year;
        };//buildYear

        /**
         * build month
         * @param {Date} month and year to create, or current month if not provided
         * @returns {jQuery|""}
         */
        function buildMonth(month){
            if(!month){
                month = new Date();
            }
            callbacks.monthBefore.fire( month );
            var thisMonth = month.getMonth(), 
            $month = $(options.month_template.replace("{name}", options.months[thisMonth])),
            checkMonth = function($day, day){
                if(day.getMonth() !== thisMonth){
                    $day.addClass('calendar-day-filler');
                }
                return true;
            };

            on('dayAfter', checkMonth);

            month.setDate(1);
            month.setHours(12,0,0);

            $month.append(buildHeader());

            while(month.getMonth() === thisMonth){
                $month.append(buildWeek(month));
            }

            off('dayAfter', checkMonth);

            callbacks.monthAfter.fire( $month, month );
            return $month;
        };//buildMonth

        /**
         * build header with weekdays
         * @returns {jQuery||""}
         */
        function buildHeader(){
            if(options.header_template.length > 0){
                var $header = $(options.header_template);
                for(var x = 0; x < options.weekdays.length; x++){
                    $header.append($(options.weekday_template).text(options.weekdays[x]));
                }
                return $header;
            }else{
                return "";
            }
        };//buildHeader

        /**
         * build provided week
         * @param {Date} week any day in the requested week
         * @returns {jQuery} representing one week row}
         */
        function buildWeek(week){
            callbacks.weekBefore.fire(week);
            var $week = $(options.week_template);
            week.setDate(week.getDate() - week.getDay());                                                                                                    
            do{
                $week.append(buildDay(week));
                week.setDate(week.getDate() + 1);
            }while(week.getDay() > 0);
            callbacks.weekAfter.fire($week, week);
            return $week;
        };//buildWeek

        /**
         * make day cell
         * @param {Date} day
         * @returns {jQuery|""}  representing one day cell loaded
         */
        function buildDay(day){
            var today = new Date();
            callbacks.dayBefore.fire(day);
            var $day = $(options.day_template);
            $day.append( buildDate(day));
            $day.data("date", new Date(day));
            if( sameDay(day, today) ){
                $day.addClass('date-today');
            }
            callbacks.dayAfter.fire($day, day);
            return $day;
        };//buildDay

        /**
         * build date header for calendar day
         * @param {Date} day
         * @returns {$|Window.$|@exp;_$|jQuery}
         */
        function buildDate(day){
            var $dt = $(options.date_template);
            $dt.find(":contains('{string}')").text(day.toDateString().substr(0, 7));
            $dt.find(":contains('{number}')").text(day.getDate());
            return $dt;
        };//buildDate
        
        function sameDay(dt1, dt2){
            return dt1.getYear() === dt2.getYear() && 
            dt1.getMonth() === dt2.getMonth() &&
            dt1.getDate() === dt2.getDate();
        };
        
        /**
         * register a callback function
         * @param {String} ident
         * @param {Function} fn
         * @returns {undefined}
         */
        function on(ident, fn){
            if(!!callbacks[ident]){
                callbacks[ident].add(fn);
            }
        }
        
        /**
         * remove a callback function
         * @param {String} ident
         * @param {Function} fn
         * @returns {undefined}
         */
        function off(ident, fn){
            if(!!callbacks[ident]){
                callbacks[ident].remove(fn);
            }
        }

        return {
            year: buildYear,
            month: buildMonth,
            week: buildWeek,
            day: buildDay,
            on: on,
            off: off
        };//the object

    };//display
    
    
    /**
     * control object to manage the calendar controls
     * @param {Object} opts options
     * @returns {calendarmaker_L17.control.calendarmakerAnonym$3}
     */

    function control(opts){
        var incrementor, //number of units to increment by
        unit, //unit we are incrementing months, years, days
        $prev, //reference to previous link
        $months = $([]), //reference to months chooser
        $month, //reference to month text
        $years = $([]), //reference to years chooser
        $year, //reference to year text
        $next, //reference to next link
        current, //currently chosen date
        callbacks = {
            update: $.Callbacks()
        }; 

        var options = {},
        default_options = {
            prev_container_template: '<div class="control-previous"></div>',
            next_container_template: '<div class="control-next"></div>',
            prev_html: '<span><<</span>',
            next_html: '<span>>></span>',
            month_container_template: '<div class="control-month"></div>',
            year_container_template: '<div class="control-year"></div>',
            month_html: '<h1 class="control-month-text"></h1>',
            year_html: '<h1 class="control-year-text"></h1>',
            chooser_template: '<ul>',
            chooser_item_template: '<li>',
            first_year: -5,
            last_year: 1,
            interval: '1M',
            initial_date: new Date()
        };

        $.extend(options, default_options, opts);

        function init(){
            unit = options.interval.substr(-1);
            incrementor = eval(options.interval.substr(0, options.interval.length -1));
            current = new Date(options.initial_date);
            $prev = $(options.prev_container_template).append(options.prev_html).click(function(){increment(-1);});
            $next = $(options.next_container_template).append(options.next_html).click(function(){increment(1);});
            switch(unit){
                case "M":
                    $months = createChooser("month");
                    setMonth(current.getMonth());
                case "Y":
                    $years = createChooser("year");
                    setYear(current.getFullYear());
            }

            callbacks.update.add(checkLimits);

            callbacks.update.fire(new Date(current));

            return [$prev, $months, $years, $next];
        }

        /**
         * create the chooser element
         * @param {String} type "year" or "month"
         * @returns {jQuery}
         */
        function createChooser(type){
            var $chooser = $(options.chooser_template), $unit = $(options[type + "_html"]);
            switch(type ){
                case "year":
                    $year = $unit;

                    var n = new Date(),
                    first = options.first_year < 100 ? n.getFullYear() + options.first_year : options.first_year,
                    last = options.last_year < 100 ?  n.getFullYear() + options.last_year : options.last_year;

                    for(var x = first; x <= last; x++){
                        $chooser.append($(options.chooser_item_template).data("unit", type).data("value", x).text(x));
                    }
                    break;
                case "month":
                    $month = $unit;

                    for(var x in options.months){
                        $chooser.append($(options.chooser_item_template).data("unit", type).data("value", x).text(options.months[x]));
                    }
            }
            return $(options[type + '_container_template']).append($unit).append($chooser).click(set);
        }

        /**
         * move by increment provided. ie: dir * incrementor
         * @param {Number} dir 1 to move next, -1 to move prev
         * @returns {undefined}
         */
        function increment(dir){
            goTo(checkIncrement(dir));
        }

        /**
         * handle month and year choosers
         * @param {jQuery.Event} ev
         * @returns {undefined}
         */
        function set(ev){
            var $target = $(ev.target), $me = $(this);
            switch($target.data("unit")){
                case "year":
                    setYear($target.data("value"));
                    current.setYear($target.data("value"));
                    callbacks.update.fire( new Date(current) );
                    break;
                case "month":
                    setMonth($target.data("value"));
                    current.setMonth($target.data("value"));
                    callbacks.update.fire( new Date(current) );
                    break;
            }
            $me.toggleClass("open");
        }

        /**
         * 
         * @param {Date} dt date to jump to
         * @returns {undefined}
         */
        function goTo(dt){
            if(validYear( dt.getFullYear() )){
                switch(unit){
                    case "M":
                        setMonth( dt.getMonth() );
                    case "Y":
                        setYear( dt.getFullYear() );
                    case "D":
                        current.setTime(dt.getTime());
                }
                callbacks.update.fire( new Date(current) );
            }
        }

        /**
         * update year text to provided year
         * @param {Year} year
         * @returns {undefined}
         */
        function setYear(year){
            if(validYear(year)){
                $year.text(year);
            }
        }

        /**
         * update month text to provided month
         * @param {Number} month
         * @returns {undefined}
         */
        function setMonth(month){
            $month.text(options.months[month]);
        }

        /**
         * return copy of currently selected date
         * @returns {Date}
         */
        function getCurrent(){
            return new Date(current);
        }

        /**
         * checks if year is allowd
         * @param {Number} year
         * @returns {Boolean}
         */
        function validYear(year){
            return unit === "D" || $years.filter(":contains(" + year + ")").length > 0;
        }

        /**
         * check if provided increment is a valid date
         * @param {Number} dir
         * @returns {Boolean|Date}
         */
        function checkIncrement(dir){
            var temp = new Date(), num = incrementor * dir;
            temp.setTime(current.getTime());
            switch(unit){
                case "M":
                    temp.setMonth(temp.getMonth() + num);
                    if( validYear( temp.getFullYear() ) ){
                        return temp;
                    }
                    break;
                case "Y":
                    temp.setFullYear(temp.getFullYear() + num);
                    if( validYear( temp.getFullYear() ) ){
                        return temp;
                    }
                    break;
                case "D":
                    temp.setDate(temp.getDate() + num);
                    return temp;
            }
            return false;
        }

        /**
         * disable/enable next prev links
         * @returns {undefined}
         */
        function checkLimits(){
            if(checkIncrement(-1) === false){
                $prev.addClass("disabled");
            }else{
                $prev.removeClass("disabled");
            }
            if(checkIncrement(1) === false){
                $next.addClass("disabled");
            }else{
                $next.removeClass("disabled");
            } 
        }

        function getOpt(name){
            return options[name];
        }
        
        /**
         * register a callback function
         * @param {String} ident
         * @param {Function} fn
         * @returns {undefined}
         */
        function on(ident, fn){
            if(!!callbacks[ident]){
                callbacks[ident].add(fn);
            }
        }
        
        /**
         * remove a callback function
         * @param {String} ident
         * @param {Function} fn
         * @returns {undefined}
         */
        function off(ident, fn){
            if(!!callbacks[ident]){
                callbacks[ident].remove(fn);
            }
        }

        return {
            init: init,
            on: on,
            off: off,
            options: getOpt,
            current: getCurrent,
            goTo: goTo
        };
    };//control
    
    /**
     * 
     * @param {Object|String} opts options object to initialize, string to perform action, "submit", "reset", "remove", "JSON"
     * @param {Any} val value to pass to requested action, on->function, off->function, goTo->Date
     * @returns {town_L100.$.fn@call;each}
     */
    $.fn.calendarmaker = function(opts, val, fn){
        return this.each(function(){
            var $this = $(this), data = $this.data("calendarmaker");
            if(!!data){
                switch(opts){
                    case "on":
                    case "off":
                    case "goTo":
                        data[opts](val, fn);
                }
            }else{
                $this.data("calendarmaker", new calendarmaker($this, opts));
            } 
        });

    };
    
}(jQuery));