/* Clase Graph -- Superclase de gráficas que define un interfaz para que diferentes clases especializadas lo hereden y utilicen */
function Graph(parentDiv) {
    this.canvasObj = {};  
    this.context = {};
    this.data = [];

    this.canvasObj = document.createElement("canvas");
    this.context = this.canvasObj.getContext("2d");
    parentDiv.appendChild(this.canvasObj);

    this.canvasObj.style.display = "block";
    this.canvasObj.width = parentDiv.clientWidth;
    this.canvasObj.height = parentDiv.clientHeight;
    this.paddingWidth = 100;
    this.paddingHeight = 50;
    this._originalWidth = parentDiv.clientWidth; //parámetro que se usará para calcular el aspect ratio.

    var that = this;
    window.addEventListener("resize", function () { that.resize(parentDiv); });
    window.addEventListener("orientationchange", function () { that.resize(parentDiv) });
    window.addEventListener("fullscreenchange", function () { that.resize(parentDiv) });
}

Graph.prototype = (function () {

    //Método privado que gestiona el evento de click del ratón sobre el canvas, lanzando eventos onClick sobre la gráfica cuando se hace click 
    //en un elemento de la misma
    function canvasClick(event) {
        lookForHit.call(this, event, function (graph, value) {
            if (value != undefined)
                this.onClick(this.data[graph][value], event);
            else
                this.onClick(this.data[graph], event);
        });
    }

    //Método privado que gestiona el evento de movimiento del ratón sobre el canvas, lanzando eventos onMouseHover y onMouseOut sobre la gráfica 
    //cuando se detecta movimiento del ratón sobre los elementos de la misma o fuera de ellos.
    function canvasMouseMove(event) {
        var isHit = lookForHit.call(this, event, function (graph, value) {
            if (value != undefined) {
                this.onMouseHover(this.data[graph][value], event);
                return;
            } else {
                this.onMouseHover(this.data[graph], event);
                return;
            }
        });

        if (!isHit)
            this.onMouseOut(this.data, event);
    }

    //Método privado que busca un hit de las coordenadas de un evento de ratón en el array de datos.
    //Cuando se encuentra un hit se lanza un callback pasado por parámetro y se retorna cierto, si no hay hit retorna falso
    function lookForHit(event, callback) {
        coords = relMouseCoords.call(this, event);
        for (var graph in this.data) {
            if (this.data[graph] instanceof Array) {
                for (var value in this.data[graph]) {
                    if (this.isInside(coords, this.data[graph][value], graph, value)) {
                        callback.call(this, graph, value);
                        return true;
                    }
                }
            } else {
                if (this.isInside(coords, this.data[graph], graph)) {
                    callback.call(this, graph);
                    return true;
                }
            }
        }

        return false; //No ha habido hit.
    }

    //Método privado que traduce la posición actual del ratón a las coordenadas del canvas del objeto.
    function relMouseCoords(event) {
        var totalOffsetX = 0;
        var totalOffsetY = 0;
        var canvasX = 0;
        var canvasY = 0;
        var currentElement = this.canvasObj;

        do {
            totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
            totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
        }
        while (currentElement = currentElement.offsetParent)

        canvasX = event.pageX - totalOffsetX;
        canvasY = event.pageY - totalOffsetY;

        return { x: canvasX, y: canvasY }
    }

    //Definición del interfaz público del prototipo de la clase Graph
    return {
        constructor: Graph,
        //Método público que dibuja una retícula en función de los datos cargados en el objeto Graph y los parámetros de la función que lo llama 
        drawReticle: function () {
            var xOffset = 0, yOffset = 0;
            var language = window.navigator.userLanguage || window.navigator.language;

            //Comienza el dibujo de la retícula
            this.context.font = this._font;
            this.context.fillStyle = "#000";
            this.context.textAlign = "center";

            //Si la gráfica lleva título se dibuja también.
            if (this.title != null)
                this.context.fillText(this.title, this.canvasObj.width / 2, (this.paddingHeight + 10) / 2)

            //Si hay leyenda se dispondrá al menos de 60px encima de la gráfica para dibujarla.
            if (this.legend.length > 0) {
                var legendSpace = this.canvasObj.width / this.legend.length;
                for (var legendElement in this.legend) {
                    this.context.textAlign = "left";
                    this.context.fillStyle = (legendElement < this.colors.length) ? this.colors[legendElement] : "#000";
                    this.context.fillRect((legendSpace * legendElement) + (legendSpace / 2) - 50, ((this.paddingHeight + 10) / 2) + 10, 10, 10);
                    this.context.fillStyle = "#000";
                    this.context.fillText(this.legend[legendElement], (legendSpace * legendElement) + (legendSpace / 2) - 30,
                        ((this.paddingHeight + 10) / 2) + 20);
                }
            }
            this.context.fillStyle = "#DDD";
            this.context.textAlign = "center";

            //Si el usuario ha pasado etiquetas se colocan las etiquetas, si no los valores cargados en base a los máximos y mínimos
            if (this.labelsX == null) {
                if (this.isDateX) {
                    var daysToLastMonth = 0, daysToLastYear = 0, daysFromMinToToday = 0;
                    var fechaIni = new Date(this.minX * 86400000), fechaFin = new Date(this.maxX * 86400000);
                    for (var dateToday = new Date(fechaIni) ; dateToday <= fechaFin; dateToday.setDate(dateToday.getDate() + 1)) {
                        if (this.dateStepX.indexOf("days") != -1) {
                            this.context.fillStyle = "#DDD";
                            this.context.fillRect(this._xCenter + (daysFromMinToToday * this._unitX), this._yCenter, 1, -this._graphY);
                            if (dateToday < fechaFin) {
                                this.context.fillText(dateToday.getDate(), this._xCenter + (daysFromMinToToday * this._unitX) + (this._unitX / 2),
                                    this._yCenter - this._graphY - 5);
                                if (this.dateStepX.indexOf("weeks") != -1)
                                    this.context.fillText(dateToday.toLocaleDateString(language, { weekday: "narrow" }), this._xCenter
                                        + (daysFromMinToToday * this._unitX) + (this._unitX / 2), this._yCenter - this._graphY - 15);
                            }
                        }
                        var weekDay = dateToday.getDay();
                        if (this.dateStepX.indexOf("weeks") != -1 && ((!this.weeksStartsOnSundays && weekDay == 1)
                            || (this.weeksStartsOnSundays && weekDay == 0))) {
                            this.context.fillStyle = "#BBB";
                            this.context.fillRect(this._xCenter + (daysFromMinToToday * this._unitX), this._yCenter, 1, -this._graphY);
                            if (this.dateStepX.indexOf("days") == -1)
                                this.context.fillText(dateToday.getDate(), this._xCenter + (daysFromMinToToday * this._unitX), this._yCenter
                                    - this._graphY - 5);
                        }
                        if (this.dateStepX.indexOf("months") != -1 && dateToday.getDate() == 1) {
                            this.context.fillStyle = "#888";
                            this.context.fillRect(this._xCenter + (daysFromMinToToday * this._unitX), this._yCenter, 1, -this._graphY);
                            if (daysToLastMonth != 0) {
                                this.context.fillStyle = "#000";
                                var previousMonth = new Date(dateToday);
                                previousMonth.setDate(dateToday.getDate() - 1);
                                this.context.fillText(previousMonth.toLocaleDateString(language, { month: "long" }), this._xCenter
                                    + (daysFromMinToToday * this._unitX) - ((daysToLastMonth / 2) * this._unitX), this._yCenter + 12);
                                daysToLastMonth = -1;
                            }
                        }
                        if (this.dateStepX.indexOf("years") != -1 && dateToday.getDate() == 1 && dateToday.getMonth() == 0) {
                            this.context.fillStyle = "#333";
                            this.context.fillRect(this._xCenter + (daysFromMinToToday * this._unitX), this._yCenter, 1, -this._graphY);
                            if (daysToLastYear != 0) {
                                var previousYear = new Date(dateToday);
                                previousYear.setDate(dateToday.getDate() - 1);
                                this.context.fillText(previousYear.getFullYear(), this._xCenter + (daysFromMinToToday * this._unitX)
                                    - (((daysToLastYear + 1) / 2) * this._unitX), this._yCenter + 25);
                                daysToLastYear = -1;
                            }
                        }
                        daysFromMinToToday++;
                        daysToLastMonth++;
                        daysToLastYear++;
                    }
                    //Al terminar de recorrer los días, si se están mostrando años y/o meses, debe marcarse el último de cada uno de ellos.
                    if (this.dateStepX.indexOf("months") != -1 && daysToLastMonth != 0) {
                        this.context.fillStyle = "#000";
                        var previousMonth = new Date(dateToday);
                        previousMonth.setDate(dateToday.getDate() - 1);
                        this.context.fillText(previousMonth.toLocaleDateString(language, { month: "long" }),
                            this._xCenter + (daysFromMinToToday * this._unitX) - ((daysToLastMonth / 2) * this._unitX), this._yCenter + 12);
                    }

                    if (this.dateStepX.indexOf("years") != -1 && daysToLastYear != 0) {
                        this.context.fillStyle = "#333";
                        var previousYear = new Date(dateToday);
                        previousYear.setDate(dateToday.getDate() - 1);
                        this.context.fillText(previousYear.getFullYear(), this._xCenter + (daysFromMinToToday * this._unitX)
                            - (((daysToLastYear + 1) / 2) * this._unitX), this._yCenter + 25);
                    }
                } else {
                    for (var x = this.minX; x <= this.maxX; x = x + this.unitStepX) {
                        this.context.fillRect(this._xCenter + xOffset, this._yCenter, 1, -this._graphY);
                        if (x != 0) {
                            this.context.fillStyle = "#000";
                            this.context.fillText(x, this._xCenter + xOffset, this._yCenter + 12)
                            this.context.fillStyle = "#DDD";
                        }
                        xOffset += this._offsetIncreaseX;
                    }
                }
            } else {
                this.context.fillStyle = "#000";
                xOffset = this._graphX / this.labelsX.length;
                for (var current in this.labelsX)
                    this.context.fillText(this.labelsX[current], this._xCenter + (xOffset * current) + (xOffset / 2), this._yCenter + 12);
            }

            if (this.labelsY == null) {
                if (this.isDateY) {
                    var daysToLastMonth = 0, daysToLastYear = 0, daysFromMinToToday = 0;
                    var fechaIni = new Date(this.minY * 86400000), fechaFin = new Date(this.maxY * 86400000);
                    this.context.textBaseline = "middle";
                    this.context.textAlign = "right";
                    for (var dateToday = new Date(fechaIni) ; dateToday <= fechaFin; dateToday.setDate(dateToday.getDate() + 1)) {
                        if (this.dateStepY.indexOf("days") != -1) {
                            this.context.fillStyle = "#DDD";
                            this.context.fillRect(this._xCenter, this._yCenter - (daysFromMinToToday * this._unitY), this._graphX, 1);
                            if (dateToday < fechaFin) {
                                this.context.fillText(dateToday.getDate(), this._xCenter + this._graphX + 15, this._yCenter
                                    - (daysFromMinToToday * this._unitY) - (this._unitY / 2));
                                if (this.dateStepY.indexOf("weeks") != -1)
                                    this.context.fillText(dateToday.toLocaleDateString(language, { weekday: "narrow" }), this._xCenter
                                        + this._graphX + 25, this._yCenter - (daysFromMinToToday * this._unitY) - (this._unitY / 2));
                            }
                        }
                        var weekDay = dateToday.getDay();
                        if (this.dateStepY.indexOf("weeks") != -1 && ((!this.weeksStartsOnSundays && weekDay == 1)
                            || (this.weeksStartsOnSundays && weekDay == 0))) {
                            this.context.fillStyle = "#BBB";
                            this.context.fillRect(this._xCenter, this._yCenter - (daysFromMinToToday * this._unitY), this._graphX, 1);
                            if (this.dateStepY.indexOf("days") == -1)
                                this.context.fillText(dateToday.getDate(), this._xCenter + this._graphX + 6, this._yCenter
                                - (daysFromMinToToday * this._unitY));
                        }
                        if (this.dateStepY.indexOf("months") != -1 && dateToday.getDate() == 1) {
                            this.context.fillStyle = "#888";
                            this.context.fillRect(this._xCenter, this._yCenter - (daysFromMinToToday * this._unitY), this._graphX, 1);
                            if (daysToLastMonth != 0) {
                                this.context.fillStyle = "#000";
                                var previousMonth = new Date(dateToday);
                                previousMonth.setDate(dateToday.getDate() - 1);
                                this.context.fillText(previousMonth.toLocaleDateString(language, { month: "long" }), this._xCenter - 12,
                                    this._yCenter - (daysFromMinToToday * this._unitY) + ((daysToLastMonth / 2) * this._unitY));
                                daysToLastMonth = -1;
                            }
                        }
                        if (this.dateStepY.indexOf("years") != -1 && dateToday.getDate() == 1 && dateToday.getMonth() == 0) {
                            this.context.fillStyle = "#333";
                            this.context.fillRect(this._xCenter, this._yCenter - (daysFromMinToToday * this._unitY), this._graphX, 1);
                            if (daysToLastYear != 0) {
                                var previousYear = new Date(dateToday);
                                previousYear.setDate(dateToday.getDate() - 1);
                                this.context.fillText(previousYear.getFullYear(), this._xCenter - 25,
                                    this._yCenter - (daysFromMinToToday * this._unitY) + (((daysToLastYear + 1) / 2) * this._unitY));
                                daysToLastYear = -1;
                            }
                        }
                        daysFromMinToToday++;
                        daysToLastMonth++;
                        daysToLastYear++;
                    }
                    //Al terminar de recorrer los días, si se están mostrando años y/o meses, debe marcarse el último de cada uno de ellos.
                    if (this.dateStepY.indexOf("months") != -1 && daysToLastMonth != 0) {
                        this.context.fillStyle = "#000";
                        var previousMonth = new Date(dateToday);
                        previousMonth.setDate(dateToday.getDate() - 1);
                        this.context.fillText(previousMonth.toLocaleDateString(language, { month: "long" }), this._xCenter - 12,
                            this._yCenter - (daysFromMinToToday * this._unitY) + ((daysToLastMonth / 2) * this._unitY));
                    }

                    if (this.dateStepY.indexOf("years") != -1 && daysToLastYear != 0) {
                        this.context.fillStyle = "#333";
                        var previousYear = new Date(dateToday);
                        previousYear.setDate(dateToday.getDate() - 1);
                        this.context.fillText(previousYear.getFullYear(), this._xCenter - 25, this._yCenter - (daysFromMinToToday * this._unitY)
                            + (((daysToLastYear + 1) / 2) * this._unitY));
                    }
                } else {
                    for (var y = this.minY; y <= this.maxY; y = y + this.unitStepY) {
                        this.context.fillRect(this._xCenter, this._yCenter - yOffset, this._graphX, 1);
                        if (y != 0) {
                            this.context.fillStyle = "#000";
                            this.context.fillText(y, this._xCenter - 12, this._yCenter - yOffset + 5);
                            this.context.fillStyle = "#DDD";
                        }
                        yOffset += this._offsetIncreaseY;
                    }
                }
            } else {
                this.context.fillStyle = "#000";
                this.context.textAlign = "right";
                yOffset = this._graphY / this.labelsY.length;
                for (var current in this.labelsY)
                    this.context.fillText(this.labelsY[current], this._xCenter - 12, this._yCenter - (yOffset * current) + 5 - (yOffset / 2));
            }
        },
        //Método que dibuja los ejes de coordenadas
        drawAxis: function () {
            this.context.textAlign = "center";
            this.context.fillStyle = "#000";

            if (this.labelsX == null && this.minX <= 0 && this.maxX >= 0) {
                this.context.fillRect(this._xCenter0, this._yCenter, 1, -this._graphY);
                if (this._xCenter0 == this._xCenter && this._yCenter0 == this._yCenter)
                    this.context.fillText("0", this._xCenter0 - 5, this._yCenter0 + 12);
                else
                    this.context.fillText("0", this._xCenter0, this._yCenter + 12);
            } else
                this.context.fillRect(this._xCenter, this._yCenter, 1, -this._graphY);

            if (this.labelsY == null && this.minY <= 0 && this.maxY >= 0) {
                this.context.fillRect(this._xCenter, this._yCenter0, this._graphX, 1);
                if (this._xCenter0 == this._xCenter && this._yCenter0 == this._yCenter)
                    this.context.fillText("0", this._xCenter0 - 5, this._yCenter0 + 12);
                else
                    this.context.fillText("0", this._xCenter - 12, this._yCenter0 + 5);
            } else
                this.context.fillRect(this._xCenter, this._yCenter, this._graphX, 1);
        },
        //Método público de la clase Graph que carga los manejadores de eventos para una gráfica
        loadEventHandlers: function (object) {
            //Creación de la capa que se va a utilizar con los eventos por defecto
            var layer = document.createElement("div");
            layer.setAttribute("class", "graphTooltip"); //Para que se puedan cambiar los estilos del tooltip
            layer.setAttribute("style", "background:#000; color:#fff; border-radius:3px; z-index:1; position:absolute; padding:5px; "
                + "font-weight:bolder; display:none;"); // Estilos por defecto
            document.getElementsByTagName("body")[0].appendChild(layer);
            this.layer = layer;

            //Se añade un evento para que si el ratón pisa la capa, ésta se desplace fuera y continúe habilitando los eventos del canvas
            layer.addEventListener("mousemove", function (event) {
                var left = (event.pageX || (event.clientX + scrollLeft)) + 10;
                var top = event.pageY || (event.clientY + scrollTop);
                this.style.left = left + "px";
                this.style.top = top + "px";
                event.stopPropagation();
            });

            //Y otro evento que oculta la capa cuando se mueve la rueda del ratón, para evitar capas muertas.
            document.addEventListener("wheel", function (event) { layer.style.display = "none"; });

            //Asignación de listeners sobre la gráfica. 
            var me = this;
            this._clickHandler = (this._clickHandler) ? this._clickHandler : function (event) { canvasClick.call(me, event); }
            this._mousemoveHandler = (this._mouseMoveHandler) ? this._mouseMoveHandler : function (event) { canvasMouseMove.call(me, event); }
            //Primero se eliminan los listeners que pudiera haber previamente para que el redibujado de las gráficas no los acumule
            this.canvasObj.removeEventListener("mousemove", this._mousemoveHandler);
            this.canvasObj.removeEventListener("click", this._clickHandler);
            this.canvasObj.addEventListener("mousemove", this._mousemoveHandler);
            this.canvasObj.addEventListener("click", this._clickHandler);

            //Definición de los callbacks que se lanzarán cuando se genere un evento sobre la gráfica
            this.onMouseHover = (object.hasOwnProperty("onMouseHover") && typeof object.onMouseHover == "function")
                ? function (element, event) { object.onMouseHover.call(me, element, event); } : (this.onMouseHover != undefined)
                ? this.onMouseHover : function (element, event) { me.MouseHover(element, event); }
            this.onMouseOut = (object.hasOwnProperty("onMouseOut") && typeof object.onMouseOut == "function")
                ? function (element, event) { object.onMouseOut.call(me, element, event); } : (this.onMouseOut != undefined)
                ? this.onMouseOut : function (element, event) { me.MouseOut(element, event); };
            this.onClick = (object.hasOwnProperty("onClick"))
                ? function (element, event) { object.onClick.call(me, element, event) } : (this.onClick != undefined)
                ? this.onClick : function (element, event) { me.Click(element, event); };
        },
        //Método público que parsea los parámetros de definición del objeto con que se ha llamado al dibujado de la gráfica.
        parseParameters: function(object) {

            //Método interno que obtiene los valores límite a representar en un eje de coordenadas en base a los datos almacenados en data
            function calculateAxisRange(axis, object) {
                //Se remapean los datos del diccionario en un único array con todos los valores del eje que se está estudiando
                var axisArray = [];
                for (var graph in this.data) {
                    for (var point in this.data[graph])
                        axisArray.push(this.data[graph][point][axis]);
                }

                var bigAxis = axis.toUpperCase(), maxAxis = "max" + bigAxis, minAxis = "min" + bigAxis;
                if (this["isDate" + bigAxis]) {
                    this[maxAxis] = getNextOrPreviousMonth(Math.max.apply(axisArray, axisArray), true);
                    this[minAxis] = getNextOrPreviousMonth(Math.min.apply(axisArray, axisArray), false);
                } else {
                    var maxVal = Math.max.apply(axisArray, axisArray), minVal = Math.min.apply(axisArray, axisArray);
                    this[maxAxis] = (this["_dontExtendAxis" + bigAxis]) ? maxVal : getNextBiggerIntInOrder(maxVal);
                    this[minAxis] = (minVal > 0) ? 0 : (this["_dontExtendAxis" + bigAxis]) ? minVal : getNextBiggerIntInOrder(minVal);
                }

                //Conversión de los valores máximos pasados por parámetros de tipo fecha a número de días desde la fecha 0 para el eje en curso.
                if (object.hasOwnProperty(maxAxis) && this["isDate" + bigAxis])
                    object[maxAxis] = (!isNaN(Date.parse(object[maxAxis]))) ? Date.parse(object[maxAxis]) / 86400000 : object[maxAxis];

                if (object.hasOwnProperty(minAxis) && this["isDate" + bigAxis])
                    object[minAxis] = (!isNaN(Date.parse(object[minAxis]))) ? Date.parse(object[minAxis]) / 86400000 : object[minAxis];

                //Obtención de los valores acotados del eje en curso.
                if (object.hasOwnProperty(maxAxis))
                    this[maxAxis] = (object.hasOwnProperty(minAxis) && object[maxAxis] >= object[minAxis]) ? object[maxAxis]
                        : (object[maxAxis] >= this[minAxis]) ? object[maxAxis] : this[maxAxis];

                if (object.hasOwnProperty(minAxis))
                    this[minAxis] = (object.hasOwnProperty(maxAxis) && object[maxAxis] >= object[minAxis]) ? object[minAxis]
                        : (object[minAxis] <= this[maxAxis]) ? object[minAxis] : this[minAxis];
            }

            //Método interno para calcular el step de la retícula en función del rango a recorrer. 
            //Por defecto escogeremos el máximo entero por el que sea divisible el rango y que sea menor o igual que la quinta parte del mismo.
            function calculateStep(range) {
                if (isNaN(range))  //Si no hay rango no hay step (graficas de sectores p.ej)
                    return NaN;

                if (range <= 9)
                    return 1;

                var candidate = parseInt(range / 5);
                while (range % candidate != 0 && candidate != 1)
                    candidate--;

                return candidate;
            }

            //Método interno que obiene el siguiente entero mayor en base a un orden. Se usa para obtener los valores límite a partir de los 
            // valores contenidos en el array de datos cuando el usuario no determina valores límite.
            function getNextBiggerIntInOrder(i) {
                var ponderValue = (i.toString().length == 1) ? 10 : (i.toString().length - 1) * 10;
                return (i > 0) ? Math.ceil(i / ponderValue) * ponderValue : Math.floor(i / ponderValue) * ponderValue;
            }

            //Método interno que recorre hacia adelante o hacia atrás los días desde una fecha dada hasta encontrar el inicio o fin del mes.
            //Espera un número de días desde la fecha cero hasta la dada y un booleano que indica si se busca hacia adelante o hacia atrás.
            function getNextOrPreviousMonth(limitDay, next) {
                var dateLimit = new Date(limitDay * 86400000);
                var increment = (next) ? 1 : -1;
                while (dateLimit.getDate() != 1)
                    dateLimit.setDate(dateLimit.getDate() + increment);

                if (next)
                    dateLimit.setDate(dateLimit.getDate() - 1); //En caso de buscar el inicio del próximo mes, queremos devolver el día anterior.

                return Date.parse(dateLimit.toString()) / 86400000;
            }

            //Ratio de tamaño respecto a las dimensiones originales de la gráfica
            this._aspectRatio = this.canvasObj.width / this._originalWidth;

            //Flag que indica si la gráfica se puede redimensionar
            this.resizable = (object.hasOwnProperty("resizable")) ? object.resizable : true;

            //Título de la gráfica
            this.title = (object.hasOwnProperty("title")) ? object.title : (this.title) ? this.title : null;

            //Leyenda
            this.legend = (object.hasOwnProperty("legend")) ? object.legend : (this.legend) ? this.legend : [];

            //Colores
            this.colors = (object.hasOwnProperty("colors")) ? object.colors : (this.colors) ? this.colors : [];

            //Indicación de si alguno de los ejes de coordenadas representa fechas
            this.isDateX = (object.hasOwnProperty("isDateX")) ? object.isDateX : this.isDateX;
            this.isDateY = (object.hasOwnProperty("isDateY")) ? object.isDateY : this.isDateY;

            //Cálculo de los valores máximos y mínimos que representará la gráfica en función de los datos almacenados en data y el object pasado
            calculateAxisRange.call(this, "x", object);
            calculateAxisRange.call(this, "y", object);

            this.dateStepX = (object.hasOwnProperty("dateStepX")) ? object.dateStepX : (this.dateStepX) ? this.dateStepX : "days";
            this.dateStepY = (object.hasOwnProperty("dateStepY")) ? object.dateStepY : (this.dateStepY) ? this.dateStepY : "days";
            
            //Asignación del punto de inicio de dibujo de la gráfica y del ancho de la misma en base al padding definido por el usuario.
            if (!this._originalPaddingWidth || object.hasOwnProperty("paddingWidth"))
                this._originalPaddingWidth = (object.hasOwnProperty("paddingWidth")) ? object.paddingWidth : this.paddingWidth;
            this.paddingWidth = (object.hasOwnProperty("paddingWidth")) ? object.paddingWidth : this._originalPaddingWidth * this._aspectRatio;
            this.paddingHeight = (object.hasOwnProperty("paddingHeight")) ? object.paddingHeight : this.paddingHeight;

            if (this.title != null && this.paddingHeight < 20)
                this.paddingHeight = 20;

            this._xCenter = this.paddingWidth;
            this._yCenter = this.canvasObj.height - this.paddingHeight;
            this._graphX = this.canvasObj.width - (2 * this.paddingWidth);
            this._graphY = this.canvasObj.height - (2 * this.paddingHeight);

            if (this.legend.length > 0 && this.paddingHeight < 60)
                this._graphY -= (60 - this.paddingHeight);

            //Cálculo del step para dibujar la cuadrícula y del tamaño de las unidades de la misma en pixels del canvas.
            var unitGapX = Math.abs(this.maxX - this.minX);
            var unitGapY = Math.abs(this.maxY - this.minY);
            this._unitX = this._graphX / unitGapX;
            this._unitY = this._graphY / unitGapY;

            //Asignación de los pasos para el dibujo de los ejes de coordenadas
            this.unitStepX = (object.hasOwnProperty("stepX") && unitGapX % object.stepX == 0) ? object.stepX
                : (this.unitStepX && unitGapX % this.unitStepX == 0) ? this.unitStepX : (this._dontExtendAxisX) ? 1 : calculateStep(unitGapX);
            this.unitStepY = (object.hasOwnProperty("stepY") && unitGapY % object.stepY == 0) ? object.stepY
                : (this.unitStepY && unitGapY % this.unitStepY == 0) ? this.unitStepY : (this._dontExtendAxisY) ? 1 : calculateStep(unitGapY);
            
            this._offsetIncreaseX = this._unitX * this.unitStepX;
            this._offsetIncreaseY = this._unitY * this.unitStepY;
            
            //Cálculo de la posición del eje de coordenadas, que puede coincidir con el punto inicial de dibujo de la gráfica o no
            this._xCenter0 = this._xCenter - (this.minX * this._unitX);
            this._yCenter0 = this._yCenter + (this.minY * this._unitY);

            //Etiquetas de los ejes
            this.labelsX = (object.hasOwnProperty("labelsX")) ? object.labelsX : (this.labelsX) ? this.labelsX : null;
            this.labelsY = (object.hasOwnProperty("labelsY")) ? object.labelsY : (this.labelsY) ? this.labelsY : null;

            //Flag para desactivar la gestión de eventos
            this.disableEvents = (object.hasOwnProperty("disableEvents")) ? object.disableEvents : this.disableEvents;

            //Flag para que las semanas se computen comenzando en domingo
            this.weeksStartsOnSundays = (object.hasOwnProperty("weeksStartsOnSundays")) ? object.weeksStartsOnSundays : this.weeksStartsOnSundays;

            //Tipo y tamaño de letra de las gráficas
            this.fontStyle = (object.hasOwnProperty("fontStyle")) ? object.fontStyle : (this.fontStyle) ? this.fontStyle : "bold";
            this.fontVar = (object.hasOwnProperty("fontVar")) ? object.fontVar : (this.fontVar) ? this.fontVar : "";
            if (!this._originalFontSize) {
                this._originalFontSize = (object.hasOwnProperty("fontSize")) ? object.fontSize : "11px";
                this._originalFontUnit = "";
                while (isNaN(this._originalFontSize)) {
                    this._originalFontUnit = this._originalFontSize[this._originalFontSize.length - 1] + this._originalFontUnit;
                    this._originalFontSize = this._originalFontSize.substr(0, this._originalFontSize.length - 1);
                }
            }
            this.fontSize = (object.hasOwnProperty("fontSize")) ? object.fontSize
                : (this.fontSize) ? Math.ceil(this._aspectRatio * this._originalFontSize) + this._originalFontUnit : "11px";
            this.fontFamily = (object.hasOwnProperty("fontFamily")) ? object.fontFamily : (this.fontFamily) ? this.fontFamily : "Helvetica";
            this._font = this.fontStyle + " " + this.fontVar + " " + this.fontSize + " " + this.fontFamily;
        },
        //Método que lanza el redibujado de la gráfica con los parámetros que ya tiene cargados
        resize: function (parentDiv) {
            if (this.resizable) {
                this.canvasObj.width = parentDiv.clientWidth;
                this.canvasObj.height = parentDiv.clientHeight;
                //Deben pasarse específicamente los límites de los ejes, ya que son recalculados
                //En el caso especial de gráficas de barras con orientación vertical, deben además cruzarse los datos de la rotación.
                if (this.horizontalLayout != undefined && !this.horizontalLayout)
                    this.draw({
                        minX: this.minY, maxX: this.maxY, minY: this.minX, maxY: this.maxX, stepX: this.unitStepY, stepY: this.unitStepX,
                        isDateX: this.isDateY, isDateY: this.isDateX
                    });
                else
                    this.draw({ minX: this.minX, maxX: this.maxX, minY: this.minY, maxY: this.maxY });
            }
        }
    };
})();
//Fin de clase genérica de gráficas-------------------------------------------------------------------------------------------------
