/* Graph.js v.0.1.1
  Simple yet powerful API for graphs creation.
  File is divided on 5 classes:
  Graph: Master class that defines specific code common to every graphic class.
  LinearGraph: Class that allows to draw linear graphs.
  BarGraph: Class that allows to draw bar graphs.
  SectorGraph: Class that allows to draw sector graphs.
  GanttGraph: Class that allows to draw gantt diagrams.
*/

/*TODO List
    -Revisar qué pasa con los valores en el tooltip cuando el eje Y representa fechas.
    -¿Permitir un multiplicador a los segundos o los minutos para las gráficas? ¿Y ya puestos a las horas y los días?
    -Las posiciones del título y la leyenda deberían calcularse en función del tipo de letra.
    -Gestión de errores cuando nos pasen estructuras data que no sean válidas
    -¿Eventos para mover la gráfica hacia adelante y hacia atrás en el eje X? ¿Animación para desplazar los valores al mover la gráfica?
    -Las marcas parece que se dibujan con dos pixels a veces...
    -Las marcas de fechas deberían tener un color que vaya de más suave a más fuerte independientemente del tipo de marca que sean
    -Refactorizar
*/

var GraphBrowserCompatibility = function () {
    //Comprobación de que el browser acepta Canvas de HTML5
    var elem = document.createElement('canvas');
    if (elem.getContext && elem.getContext('2d')) {
        //Comprobación de la gestión de eventos
        if (elem.addEventListener) {
            if (window.Intl && window.Intl.DateTimeFormat)
                return true;
            else {
                alert("Browser not compatible with Graphs.js: There is no internationalization support.");
                return false;
            }
        } else {
            alert("Browser not compatible with Graphs.js: There is no support for addEventListener");
        }
    } else {
        alert("Browser not compatible with Graphs.js: Canvas is not supported.");
        return false;
    }
}();

if (GraphBrowserCompatibility) {

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

        //Método privado que gestiona el evento de movimiento del ratón sobre el canvas, lanzando eventos onMouseHover y onMouseOut sobre la 
        //gráfica cuando se detecta movimiento del ratón sobre los elementos de la misma o fuera de ellos.
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

        function drawLabel(data, units, currentValue, cumulativeUnits, axis, position) {
            if (axis == "X")
                this.context.fillText(data, this._xCenter + ((currentValue - this.minX) * this._unitX) - (units * this._unitX / 2),
                    (position == "top") ? this._yCenter - this._graphY - 5 - cumulativeUnits : this._yCenter + 12 + cumulativeUnits);
            else {
                this.context.textBaseline = "middle";
                this.context.textAlign = (position == "top") ? "left" : "right";
                this.context.fillText(data, (position == "top") ? this._xCenter + this._graphX + 10 + cumulativeUnits
                    : this._xCenter - 10 - cumulativeUnits, this._yCenter - ((currentValue - this.minY) * this._unitY)
                    + (units * this._unitY / 2));
                this.context.textBaseline = "alphabetic";
                this.context.textAlign = "center";
            }
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
            //Método público que dibuja una retícula en función de los datos cargados en el objeto Graph y los parámetros pasados en el objeto. 
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
                        var dateMultiplier = this.temporalUnits[this.unitDateX].dateMultiplier;
                        for (var unit in this.temporalUnits)
                            this.temporalUnits[unit].unitsToLast = 0; //Hay que reiniciar los contadores para evitar persistencia entre gráficas
                        for (var currentValue = this.minX; currentValue <= this.maxX; currentValue++) {
                            var cumulativeBottomUnits = 0; cumulativeTopUnits = 0;
                            var myDate = this.temporalUnits[this.unitDateX].loadParsedDate.call(this, currentValue);
                            var myPreviousDate = this.temporalUnits[this.unitDateX].loadParsedDate.call(this, currentValue - 1);
                            for (var unit in this.temporalUnits) {
                                if (this.temporalUnits[unit].order >= this.temporalUnits[this.unitDateX].order && this.dateStepX.indexOf(unit)
                                    != -1) {
                                    if (this.temporalUnits[unit].checkTempUnitChange(myDate, myPreviousDate, currentValue, this.maxX, this.minX)) {
                                        var cumulativeUnits = (this.temporalUnits[unit].position == "top") ? cumulativeBottomUnits
                                            : cumulativeTopUnits;
                                        //Se tienen que dibujar la marca y la etiqueta de la unidad
                                        this.context.fillStyle = this.temporalUnits[unit].markColor;
                                        this.context.fillRect(this._xCenter + ((currentValue - this.minX) * this._unitX), this._yCenter, 1,
                                            -this._graphY);
                                        this.temporalUnits[unit].label.call(this, currentValue, myDate, myPreviousDate, cumulativeUnits, "X",
                                            language);
                                    }
                                    this.temporalUnits[unit].unitsToLast++;
                                    if (this.temporalUnits[unit].position == "top")
                                        cumulativeBottomUnits += 10;
                                    else
                                        cumulativeTopUnits += 10;
                                }
                            }
                        }
                    } else {
                        for (var x = this.minX; x <= this.maxX; x = x + this.unitStepX) {
                            this.context.fillStyle = "#DDD";
                            this.context.fillRect(this._xCenter + xOffset, this._yCenter, 1, -this._graphY);
                            if (x != 0) {
                                this.context.fillStyle = "#000";
                                this.context.fillText(x, this._xCenter + xOffset, this._yCenter + 12)
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
                        var dateMultiplier = this.temporalUnits[this.unitDateX].dateMultiplier;
                        for (var unit in this.temporalUnits)
                            this.temporalUnits[unit].unitsToLast = 0; //Hay que reiniciar los contadores para evitar persistencia entre gráficas
                        for (var currentValue = this.minY; currentValue <= this.maxY; currentValue++) {
                            var cumulativeBottomUnits = 0; cumulativeTopUnits = 0;
                            var myDate = this.temporalUnits[this.unitDateX].loadParsedDate.call(this, currentValue);
                            var myPreviousDate = this.temporalUnits[this.unitDateX].loadParsedDate.call(this, currentValue - 1);
                            for (var unit in this.temporalUnits) {
                                if (this.temporalUnits[unit].order >= this.temporalUnits[this.unitDateX].order && this.dateStepY.indexOf(unit)
                                    != -1) {
                                    if (this.temporalUnits[unit].checkTempUnitChange(myDate, myPreviousDate, currentValue, this.maxY, this.minY)) {
                                        var cumulativeUnits = (this.temporalUnits[unit].position == "top") ? cumulativeBottomUnits
                                            : cumulativeTopUnits;
                                        //Se tienen que dibujar la marca y la etiqueta de la unidad
                                        this.context.fillStyle = this.temporalUnits[unit].markColor;
                                        this.context.fillRect(this._xCenter, this._yCenter - ((currentValue - this.minY) * this._unitY),
                                            this._graphX, 1);
                                        this.temporalUnits[unit].label.call(this, currentValue, myDate, myPreviousDate, cumulativeUnits, "Y",
                                            language);
                                    }
                                    this.temporalUnits[unit].unitsToLast++;
                                    if (this.temporalUnits[unit].position == "top")
                                        cumulativeBottomUnits += 10;
                                    else
                                        cumulativeTopUnits += 10;
                                }
                            }
                        }
                    } else {
                        for (var y = this.minY; y <= this.maxY; y = y + this.unitStepY) {
                            this.context.fillStyle = "#DDD";
                            this.context.fillRect(this._xCenter, this._yCenter - yOffset, this._graphX, 1);
                            if (y != 0) {
                                this.context.fillStyle = "#000";
                                this.context.fillText(y, this._xCenter - 12, this._yCenter - yOffset + 5);
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
            parseParameters: function (object) {

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
                        if (this["unitDate" + bigAxis].indexOf("days") != -1) {
                            this[maxAxis] = getNextOrPreviousMonth(Math.max.apply(axisArray, axisArray), true);
                            this[minAxis] = getNextOrPreviousMonth(Math.min.apply(axisArray, axisArray), false);
                        } else {
                            this[maxAxis] = Math.max.apply(axisArray, axisArray);
                            this[minAxis] = Math.min.apply(axisArray, axisArray);
                        }
                    } else {
                        var maxVal = Math.max.apply(axisArray, axisArray), minVal = Math.min.apply(axisArray, axisArray);
                        this[maxAxis] = (this["_dontExtendAxis" + bigAxis]) ? maxVal : getNextBiggerIntInOrder(maxVal);
                        this[minAxis] = (minVal > 0) ? 0 : (this["_dontExtendAxis" + bigAxis]) ? minVal : getNextBiggerIntInOrder(minVal);
                    }

                    //Conversión de los valores máximos pasados por parámetros de tipo fecha a número de días desde la fecha 0 para el eje en curso.
                    if (object.hasOwnProperty(maxAxis) && this["isDate" + bigAxis])
                        object[maxAxis] = (!isNaN(Date.parse(object[maxAxis] + " UTC"))) ? Date.parse(object[maxAxis] + " UTC") / 86400000
                            : object[maxAxis];

                    if (object.hasOwnProperty(minAxis) && this["isDate" + bigAxis])
                        object[minAxis] = (!isNaN(Date.parse(object[minAxis] + " UTC"))) ? Date.parse(object[minAxis] + " UTC") / 86400000
                            : object[minAxis];

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

                //Método interno que obiene el siguiente entero mayor en base a un orden. Se usa para obtener los valores límite a 
                //partir de los valores contenidos en el array de datos cuando el usuario no determina valores límite.
                function getNextBiggerIntInOrder(i) {
                    var ponderValue = (i.toString().length == 1) ? 10 : (i.toString().length - 1) * 10;
                    return (i > 0) ? Math.ceil(i / ponderValue) * ponderValue : Math.floor(i / ponderValue) * ponderValue;
                }

                //Método interno que recorre hacia adelante o hacia atrás los días desde una fecha dada hasta encontrar el inicio o 
                //fin del mes. Espera un número de días desde la fecha cero hasta la dada y un booleano que indica si se busca hacia 
                //adelante o hacia atrás.
                function getNextOrPreviousMonth(limitDay, next) {
                    var dateLimit = new Date(limitDay * 86400000);
                    var increment = (next) ? 1 : -1;
                    while (dateLimit.getDate() != 1)
                        dateLimit.setDate(dateLimit.getDate() + increment);

                    //En caso de buscar el inicio del próximo mes, queremos devolver el día anterior.
                    if (next)
                        dateLimit.setDate(dateLimit.getDate() - 1); 

                    return Date.parse(dateLimit.toString() + " UTC") / 86400000;
                }

                //Si se ha indicado un tamaño específico para el que se ha diseñado la gráfica se marca dicho tamaño como originalWidth
                this._originalWidth = (object.hasOwnProperty("designWidth")) ? object.designWidth : this._originalWidth;

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

                //Asignación del punto de inicio de dibujo de la gráfica y del ancho de la misma en base al padding definido por el usuario.
                if (!this._originalPaddingWidth || object.hasOwnProperty("paddingWidth"))
                    this._originalPaddingWidth = (object.hasOwnProperty("paddingWidth")) ? object.paddingWidth : this.paddingWidth;
                this.paddingWidth = (object.hasOwnProperty("paddingWidth")) ? object.paddingWidth : this._originalPaddingWidth;
                if (this.resizable)
                    this.paddingWidth *= this._aspectRatio;
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
                if (!this._originalFontSize)
                    this._originalFontSize = (object.hasOwnProperty("fontSize")) ? object.fontSize : "11px";
                this.fontSize = (object.hasOwnProperty("fontSize")) ? object.fontSize : (this.fontSize) ? this._originalFontSize : "11px";
                if (this._aspectRatio != 1) {
                    var fontUnit = "";
                    while (isNaN(this.fontSize)) {
                        fontUnit = this.fontSize[this.fontSize.length - 1] + fontUnit;
                        this.fontSize = this.fontSize.substr(0, this.fontSize.length - 1);
                    }
                    this.fontSize = (this.fontSize * this._aspectRatio) + fontUnit;
                }
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
            },
            temporalUnits: {
                "seconds": {
                    dateMultiplier: 1000, order: 0, markColor: "#ddd", position: "top",
                    checkTempUnitChange: function () { return true; },
                    parseDate: function (date) {
                        return Date.parse(date + " UTC") / this.temporalUnits["seconds"].dateMultiplier;
                    },
                    loadParsedDate: function (date) {
                        var myDate = new Date(date * this.temporalUnits["seconds"].dateMultiplier);
                        return myDate;
                    },
                    label: function (currentValue, myDate, myPreviousDate, cumulativeUnits, axis, language) {
                        if (myPreviousDate.getSeconds() % 5 == 0) {
                            var data = ":" + myPreviousDate.getSeconds();
                            var units = 1;
                            drawLabel.call(this, data, units, currentValue, cumulativeUnits, axis, "top")
                        }
                    }
                },
                "minutes": {
                    dateMultiplier: 60000, order: 1, markColor: "#999", position: "top", 
                    checkTempUnitChange: function (myDate, myPreviousDate, currentValue, maxValue, minValue) {
                        return currentValue != minValue && (currentValue == maxValue || myDate.getUTCMinutes() != myPreviousDate.getUTCMinutes());
                    },
                    parseDate: function (date) {
                        date = date.substr(0, 16); //Se eliminan los segundos.
                        return Date.parse(date + " UTC") / this.temporalUnits["minutes"].dateMultiplier;
                    },
                    loadParsedDate: function (date) {
                        var myDate = new Date(date * this.temporalUnits["minutes"].dateMultiplier);
                        return myDate;
                    },
                    label: function (currentValue, myDate, myPreviousDate, cumulativeUnits, axis, language) {
                        if (this.temporalUnits["minutes"].checkTempUnitChange(myDate, myPreviousDate, currentValue, this["max" + axis])) {
                            var data = (this["dateStep" + axis].indexOf("hours") != -1) ? myPreviousDate.toLocaleTimeString(language,
                                { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })
                                : myPreviousDate.toLocaleTimeString(language, { minute: "2-digit", timeZone: "UTC" });
                            var units = (this["unitDate" + axis] == "minutes") ? 1 : this.temporalUnits["minutes"].unitsToLast;
                            drawLabel.call(this, data, units, currentValue, cumulativeUnits, axis, "top");
                            this.temporalUnits["minutes"].unitsToLast = 0;
                        }
                    },
                    unitsToLast: 0
                },
                "hours": {
                    dateMultiplier: 3600000, order: 2, markColor: "#333", position: "bottom",
                    checkTempUnitChange: function (myDate, myPreviousDate, currentValue, maxValue, minValue) {
                        return currentValue != minValue && (currentValue == maxValue || myDate.getUTCHours() != myPreviousDate.getUTCHours());
                    },
                    parseDate: function (date) {
                        date = date.substr(0, 13); //Se eliminan minutos y segundos
                        return Date.parse(date + " UTC") / this.temporalUnits["hours"].dateMultiplier;
                    },
                    loadParsedDate: function (date) {
                        var myDate = new Date(date * this.temporalUnits["hours"].dateMultiplier);
                        return myDate;
                    },
                    label: function (currentValue, myDate, myPreviousDate, cumulativeUnits, axis, language) {
                        if (this["dateStep" + axis].indexOf("minutes") == -1
                            && this.temporalUnits["hours"].checkTempUnitChange(myDate, myPreviousDate, currentValue, this["max" + axis],
                            this["min" + axis])) {
                            var data = myPreviousDate.toLocaleTimeString(language, { hour: "2-digit", timeZone: "UTC" });
                            data = (data.length == 1) ? "0" + data : data; //Aparentemente, 2-digit no está implementado para horas, al menos en firefox
                            var units = (this["unitDate" + axis] == "hours") ? 1 : this.temporalUnits["hours"].unitsToLast;
                            drawLabel.call(this, data, units, currentValue, cumulativeUnits, axis, "bottom");
                            this.temporalUnits["hours"].unitsToLast = 0;
                        }
                    },
                    unitsToLast: 0
                }, "days": {
                    dateMultiplier: 86400000, order: 3, markColor: "#ddd", position: "top",
                    checkTempUnitChange: function (myDate, myPreviousDate, currentValue, maxValue, minValue) {
                        return currentValue != minValue && (currentValue == maxValue || myDate.getUTCDate() != myPreviousDate.getUTCDate());
                    },
                    parseDate: function (date) {
                        date = date.substr(0, 10); //Eliminación de las horas
                        return Date.parse(date + " UTC") / this.temporalUnits["days"].dateMultiplier;
                    },
                    loadParsedDate: function (date) {
                        var myDate = new Date(date * this.temporalUnits["days"].dateMultiplier);
                        return myDate;
                    },
                    label: function (currentValue, myDate, myPreviousDate, cumulativeUnits, axis, language) {
                        if (this.temporalUnits["days"].checkTempUnitChange(myDate, myPreviousDate, currentValue, this["max" + axis],
                            this["min" + axis])) {
                            this.context.fillStyle = "#888";
                            var data = myPreviousDate.toLocaleDateString(language, { day: "2-digit", timeZone: "UTC" });
                            var units = (this["unitDate" + axis] == "days") ? 1 : this.temporalUnits["days"].unitsToLast;
                            drawLabel.call(this, data, units, currentValue, cumulativeUnits, axis, "top");
                            if (this.dateStepX.indexOf("weeks") != -1) {
                                var labelSize = (this.dateStepX.indexOf("narrowweeks") != -1) ? "narrow"
                                    : (this.dateStepX.indexOf("shortweeks") != -1) ? "short" : "long";
                                data = myPreviousDate.toLocaleDateString(language, { weekday: labelSize });
                                drawLabel.call(this, data, units, currentValue, cumulativeUnits + 10, axis, "top");
                            }
                            this.context.textBaseline = "alphabetic";
                            this.temporalUnits["days"].unitsToLast = 0;
                        }
                    },
                    unitsToLast: 0
                },
                "weeks": {
                    dateMultiplier: 86400000, order: 4, markColor: "#999", 
                    checkTempUnitChange: function (myDate, myPreviousDate) {
                        return myDate.getDate() != myPreviousDate.getDate() && ((this.weeksStartsOnSundays && myDate.getDay() == 0)
                            || myDate.getDay() == 1);
                    },
                    parseDate: function (date, axis) {
                        return Date.parse(date + " UTC") / this.temporalUnits["weeks"].dateMultiplier;
                    },
                    loadParsedDate: function (date) {
                        var myDate = new Date(date * this.temporalUnits["weeks"].dateMultiplier);
                        return myDate;
                    },
                    label: function () { }
                },
                "months": {
                    dateMultiplier: 86400000, order: 5, markColor: "#333", position: "bottom",
                    checkTempUnitChange: function (myDate, myPreviousDate, currentValue, maxVal, minVal) {
                        return currentValue != minVal && (currentValue == maxVal || myDate.getMonth() != myPreviousDate.getMonth());
                    },
                    parseDate: function (date, axis) {
                        var loadedDate = new Date(date + " UTC");
                        var zeroDate = new Date(0);
                        //Se transforman los mínimos y máximos del eje a meses
                        var edgeDate = new Date(this["min" + axis] * 86400000);
                        this["min" + axis] = ((edgeDate.getFullYear() - zeroDate.getFullYear()) * 12) + edgeDate.getMonth();
                        edgeDate = new Date(this["max" + axis] * 86400000);
                        this["max" + axis] = ((edgeDate.getFullYear() - zeroDate.getFullYear()) * 12) + edgeDate.getMonth();
                        return  ((loadedDate.getFullYear() - zeroDate.getFullYear()) * 12) + loadedDate.getMonth();
                    },
                    loadParsedDate: function (numMonths) {
                        var numYears = numMonths / 12;
                        var currentMonth = numMonths % 12;
                        var myDate = new Date(Date.UTC(1970 + numYears, currentMonth, 1));
                        return myDate;
                    },
                    label: function (currentValue, myDate, myPreviousDate, cumulativeUnits, axis, language) {
                        if (this.temporalUnits["months"].checkTempUnitChange(myDate, myPreviousDate, currentValue, this["max" + axis],
                            this["min" + axis])) {
                            var labelSize = (this.dateStepX.indexOf("narrowmonths") != -1) ? "narrow"
                                : (this.dateStepX.indexOf("shortmonths") != -1) ? "short" : "long";
                            var data = myPreviousDate.toLocaleDateString(language, { month: labelSize, timeZone: "UTC" });
                            var units = (this["unitDate" + axis] == "months") ? 1 : this.temporalUnits["months"].unitsToLast;
                            drawLabel.call(this, data, units, currentValue, cumulativeUnits, axis, "bottom");
                            this.temporalUnits["months"].unitsToLast = 0;
                        }
                    },
                    unitsToLast: 0
                },
                "years": {
                    dateMultiplier: 86400000, order: 6, markColor: "#000", position: "bottom",
                    checkTempUnitChange: function (myDate, myPreviousDate, currentValue, maxVal, minVal) {
                        return currentValue != minVal && (currentValue == maxVal || myDate.getFullYear() != myPreviousDate.getFullYear());
                    },
                    parseDate: function (date, axis) {
                        var loadedDate = new Date(date + " UTC");
                        var zeroDate = new Date(0);
                        //Se transforman los mínimos y máximos del eje a años
                        var edgeDate = new Date(this["min" + axis] * 86400000);
                        this["min" + axis] = edgeDate.getFullYear() - zeroDate.getFullYear();
                        edgeDate = new Date(this["max" + axis] * 86400000);
                        this["max" + axis] = edgeDate.getFullYear() - zeroDate.getFullYear();
                        return loadedDate.getFullYear() - zeroDate.getFullYear();
                    },
                    loadParsedDate: function (numYears) {
                        var currentYear = 1970 + numYears;
                        var myDate = new Date(Date.UTC(currentYear, 1, 1));
                        return myDate;
                    },
                    label: function (currentValue, myDate, myPreviousDate, cumulativeUnits, axis, language) {
                        if (this.temporalUnits["years"].checkTempUnitChange(myDate, myPreviousDate, currentValue, this["max" + axis], 
                            this["min" + axis])) {
                            var data = myPreviousDate.getFullYear();
                            var units = this.temporalUnits["years"].unitsToLast;
                            drawLabel.call(this, data, units, currentValue, cumulativeUnits, axis, "bottom");
                            this.temporalUnits["years"].unitsToLast = 0;
                        }
                    },
                    unitsToLast: 0
                }
            }
        };
    })();
    //Fin de clase genérica de gráficas-------------------------------------------------------------------------------------------------

    //Clase de gráficas lineares--------------------------------------------------------------------------------------------------------
    function LinearGraph(parentDiv) {
        Graph.call(this, parentDiv);
    }

    //Herencia del prototipo de la clase padre
    LinearGraph.prototype = Object.create(Graph.prototype)

    //Método público que dibuja una gráfica linear en función de los datos pasados en object.data y el resto de parámetros de  object.
    LinearGraph.prototype.draw = function (object) {

        //Método interno que devuelve el x correspondiente al punto de corte entre la recta que une a los puntos (a, b) y (c, d) y la 
        //recta paralela al eje de las equis a la altura y
        //La ecuación se ha calculado mediante trigonometría básica, ya que el corte sobre la recta entre (a, b) y (c, d) a la altura y
        //genera dos triángulos rectángulos cuyo ángulo alfa es igual. Igualando las fórmulas del coseno de alfa para ambos triángulos
        //y despejando la x se obtiene una fórmula que permite calcular el punto de corte, y que será diferente si el punto hacia el que nos 
        //movemos está por encima o por debajo del punto destino en el eje de las y (salimos/reentramos por arriba o por abajo de la 
        //gráfica).
        function intersectedX(a, b, c, d, y) {
            if (b < y || b < this.minY)
                return ((c * y) - (c * b) + (a * d) - (a * y)) / (d - b);
            else
                return ((c * b) - (c * y) + (a * y) - (a * d)) / (b - d);
        }

        //Método interno que devuelve la y correspondiente al punto de corte entre la recta que une a los puntos (a, b) y (c, d) y 
        //la recta paralela al eje de las ies en la longitud x. Se basa en el mismo cálculo que el método anterior.
        function intersectedY(a, b, c, d, x) {
            if (a < x || a < this.minX)
                return ((a * d) - (x * d) + (x * b) - (c * b)) / (a - c);
            else
                return ((x * b) - (c * b) - (d * x) + (d * a)) / (a - c);
        }

        //Método interno de carga de parámetros
        function parseParameters(object) {
            var ok = true;

            //Método interno que carga el parámetro data de la clase a partir del parámetro que se pasa. Los elementos de data que son 
            //arrays de datos se cargan directamente, los que son funciones se ejecutan en un rango determinado para obtener los valores.
            function loadData(object) {
                var limMin = (object.hasOwnProperty("minX")) ? object.minX : 0;
                var limMax = (object.hasOwnProperty("maxX")) ? object.maxX : 100;
                var step = (object.hasOwnProperty("stepX")) ? object.stepX : 1;

                //Método interno que ejecuta una función en un rango predefinido de valores y devuelve el resultado en un array de objetos (x,y)
                function execute(func) {
                    var dataArray = [];
                    try {
                        for (var point = limMin; point <= limMax; point++) {
                            var xVal = point * step;
                            dataArray[point] = {};
                            dataArray[point].x = xVal;
                            dataArray[point].y = func(xVal);
                        }
                    } catch (ex) {
                    }

                    return dataArray;
                }

                //Método interno que retorna un array con todos los elementos de un array dado que contienen los parámetros x e y.
                function loadArrayData(arr, isDateX, isDateY) {
                    var dataArray = [];
                    for (var point in arr) {
                        if (arr[point].hasOwnProperty("x") && arr[point].hasOwnProperty("y"))
                            dataArray[point] = arr[point];
                        else if (typeof arr[point] == "number")
                            dataArray[point] = { x: dataArray.length, y: arr[point] };
                        if (isDateX)
                            dataArray[point].x = this.temporalUnits[this.unitDateX].parseDate.call(this, dataArray[point].x, "X");
                        if (isDateY)
                            dataArray[point].y = this.temporalUnits[this.unitDateY].parseDate.call(this, dataArray[point].y, "Y");
                    }

                    return dataArray;
                }

                //Data puede ser un array de datos, una función o un array de arrays de datos o funciones
                //Los arrays de datos deben contener objetos con los parámetros x e y, o bien valores numéricos.
                if (typeof object.data == "function")
                    this.data[0] = execute(object.data);
                else if (object.data instanceof Array) {
                    if (object.data[0] instanceof Array || typeof object.data[0] == "function") {
                        for (var graph in object.data) {
                            if (typeof object.data[graph] == "function")
                                this.data[graph] = execute(object.data[graph]);
                            else if (object.data[graph] instanceof Array)
                                this.data[graph] = loadArrayData.call(this, object.data[graph], object.isDateX || this.isDateX, object.isDateY
                                    || this.isDateY);
                        }
                    } else
                        this.data[0] = loadArrayData.call(this, object.data, object.isDateX || this.isDateX, object.isDateY || this.isDateY);
                }
            }

            this.dateStepX = (object.hasOwnProperty("dateStepX")) ? object.dateStepX : (this.dateStepX) ? this.dateStepX : "days";
            this.dateStepY = (object.hasOwnProperty("dateStepY")) ? object.dateStepY : (this.dateStepY) ? this.dateStepY : "days";
            this.unitDateX = (object.hasOwnProperty("unitDateX")) ? object.unitDateX : (this.unitDateX) ? this.unitDateX : "days";
            this.unitDateY = (object.hasOwnProperty("unitDateY")) ? object.unitDateY : (this.unitDateY) ? this.unitDateY : "days";

            //Si se pasa un diccionario de datos, éste se intenta cargar.
            if (object.hasOwnProperty("data"))
                loadData.call(this, object);
            else if (this.data == [])
                ok = false;

            //Llamada al método de la superclase
            this.parseParameters(object);

            //Carga de parámetros específicos para gráficas lineares
            this.lineWidth = (object.hasOwnProperty("lineWidth")) ? object.lineWidth : (this.lineWidth) ? this.lineWidth : 1;
            this.drawPoints = (object.hasOwnProperty("drawPoints")) ? object.drawPoints : (this.drawPoints != undefined) ? this.drawPoints : true;
            this.pointRadius = (object.hasOwnProperty("pointRadius")) ? object.pointRadius : (this.pointRadius) ? this.pointRadius : 3;
            this.fillPoints = (object.hasOwnProperty("fillPoints")) ? object.fillPoints : this.fillPoints;

            return ok;
        }

        //Borrado del canvas, ya que puede que no sea la primera vez que se dibuja la gráfica
        this.context.clearRect(0, 0, this.canvasObj.width, this.canvasObj.height);

        //Carga de los parámetros de la gráfica
        if (!parseParameters.call(this, object)) {
            alert("No ha podido cargarse la colección de datos para representar la gráfica");
            return;
        }

        //Gestión de eventos en la gráfica
        if (!this.disableEvents)
            this.loadEventHandlers(object);

        //Dibujo de la retícula
        this.drawReticle();

        var xOffset = 0, yOffset = 0;

        //Se recorre cada array de datos, trazando una línea entre cada dos puntos.
        this.context.lineWidth = this.lineWidth;
        this.context.fillStyle = "#FFF";
        for (var graph in this.data) {
            this.context.strokeStyle = (this.colors.length > graph) ? this.colors[graph] : "#000";
            var placed = false;
            var previousX = this.data[graph][0].x;
            var previousY = this.data[graph][0].y;
            this.context.beginPath();
            for (var point in this.data[graph]) {
                var x = this.data[graph][point].x, y = this.data[graph][point].y;
                if (this.minX <= x && x <= this.maxX) {
                    //Si el punto previo está fuera de la X mínima tengo que posicionar el path en la intersección con la X mínima
                    //de la recta entre el punto anterior y el punto actual
                    if (previousX < this.minX) {
                        var entryY = intersectedY(previousX, previousY, x, y, this.minX);
                        this.context.moveTo(this._xCenter, this._yCenter0 - (this._unitY * entryY));
                        placed = true;
                    }
                    if (!placed) {
                        this.context.moveTo(this._xCenter0 + (this._unitX * x), this._yCenter0 - (this._unitY * y));
                        placed = true;
                    }
                    //Si el punto previo está fuera del rango de las Y
                    if (previousY > this.maxY || previousY < this.minY) {
                        //Si el punto al que nos desplazamos también está fuera basta con que coloquemos el path sobre el nuevo punto
                        if (y > this.maxY || y < this.minY) {
                            this.context.moveTo(this._xCenter0 + (this._unitX * x), this._yCenter0 - (this._unitY * y));
                            continue; //Seguimos el proceso con el siguiente punto
                        } else if (previousX >= this.minX) {
                            //Si no hay que calcular el punto X de reentrada en la gráfica y dibujar a partir de él siempre que el punto 
                            //anterior ya estuviera dentro del rango X de la gráfica.
                            var currentEdge = (previousY > this.maxY) ? this.maxY : this.minY;
                            var xReentryPoint = intersectedX(previousX, previousY, x, y, currentEdge);
                            this.context.moveTo(this._xCenter0 + (this._unitX * xReentryPoint), this._yCenter0 - (this._unitY * currentEdge));
                        }
                    }
                    //Si vamos hacia una Y fuera del valor máximo o mínimo hay que calcular la X en el punto extremo de Y
                    if (y > this.maxY || y < this.minY) {
                        var currentEdge = (y > this.maxY) ? this.maxY : this.minY;
                        var maxXReached = intersectedX(previousX, previousY, x, y, currentEdge);
                        this.context.lineTo(this._xCenter0 + (this._unitX * maxXReached), this._yCenter0 - (this._unitY * currentEdge));
                    } else {
                        this.context.lineTo(this._xCenter0 + (this._unitX * x), this._yCenter0 - (this._unitY * y));
                    }
                    this.context.moveTo(this._xCenter0 + (this._unitX * x), this._yCenter0 - (this._unitY * y));
                    //Si el punto anterior aún estaba dentro del rango X tenemos que desplazarnos hasta el límite de la X
                } else if (previousX >= this.minX && previousX <= this.maxX && previousY >= this.minY && previousY <= this.maxY) {
                    var exitY = intersectedY(previousX, previousY, x, y, this.maxX);
                    this.context.lineTo(this._xCenter0 + (this._unitX * this.maxX), this._yCenter0 - (this._unitY * exitY));
                }
                previousX = x;
                previousY = y;
            }
            this.context.fill();
            this.context.stroke();
        }

        //Se dibuja el eje de coordenadas
        this.drawAxis();

        //Tras dibujar las líneas deben recorrerse de nuevo los datos colocando círculos sobre los puntos de datos. 
        //No puede hacerse en el primer recorrido porque el path del canvas dibujaría parte de las líneas dentro de los círculos. 
        //Para que estén completamente limpios se dibujan encima.
        if (this.drawPoints) {
            for (var graph in this.data) {
                this.context.strokeStyle = (this.colors.length > graph) ? this.colors[graph] : "#000";
                this.context.fillStyle = (this.fillPoints) ? this.context.strokeStyle : "#FFF";
                for (var point in this.data[graph]) {
                    var x = this.data[graph][point].x, y = this.data[graph][point].y;
                    if (x >= this.minX && x <= this.maxX && y >= this.minY && y <= this.maxY) {
                        this.context.beginPath();
                        this.context.arc(this._xCenter0 + (this._unitX * x), this._yCenter0 - (this._unitY * y), this.pointRadius, 0, 2 * Math.PI);
                        this.context.stroke();
                        this.context.fill();
                    }
                }
            }
        }
    }

    //Método que define el comportamiento por defecto del evento onMouseHover de las gráficas Lineares
    LinearGraph.prototype.MouseHover = function (element, event) {
        var left = (event.pageX || (event.clientX + scrollLeft)) + 10;
        var top = event.pageY || (event.clientY + scrollTop);
        this.layer.innerHTML = "Val: " + element.y;
        this.layer.style.left = left + "px";
        this.layer.style.top = top + "px";
        this.layer.style.display = "block";
    }

    //Método que define el comportamiento por defecto del evento onMouseOut de las gráficas Lineares
    LinearGraph.prototype.MouseOut = function () {
        this.layer.style.display = "none";
    }

    //Método que define el comportamiento por defecto del evento onClick de las gráficas Lineares
    LinearGraph.prototype.Click = function () { }

    //Método que determina si un punto de coordenadas del canvas se encuentra en uno de los elementos de la gráfica Linear.
    LinearGraph.prototype.isInside = function (coords, point) {
        var pointToCoords = {};
        pointToCoords.x = this._xCenter0 + (this._unitX * point.x);
        pointToCoords.y = this._yCenter0 - (this._unitY * point.y);
        return (pointToCoords.x >= this._xCenter && pointToCoords.x <= this._xCenter + this._graphX && pointToCoords.y <= this._yCenter
            && pointToCoords.y >= this._yCenter - this._graphY && pointToCoords.x - this.pointRadius <= coords.x
            && pointToCoords.x + this.pointRadius >= coords.x && pointToCoords.y - this.pointRadius <= coords.y
            && pointToCoords.y + this.pointRadius >= coords.y);
    }

    //Fin de clase de gráficas lineares---------------------------------------------------------------------------------------------

    //Clase de gráficas de barras---------------------------------------------------------------------------------------------------
    function BarGraph(parentDiv) {
        Graph.call(this, parentDiv);
    }

    //Herencia del prototipo de la clase padre
    BarGraph.prototype = Object.create(Graph.prototype)

    //Método que dibuja una gráfica de barras en función de los datos pasados en el parámetro object.data y los parámetros definidos en object
    BarGraph.prototype.draw = function (object) {

        //Método que calcula el punto hasta el que hay que desplazar la barra dependiendo de los valores de max y min, el eje en el que estamos
        //dibujando y el posible valor actual. De este modo se impide que las barras crezcan más allá de los límites máximos y mínimos.
        function getCurrentValue(value, axis, current) {
            var maxAxis = "max" + axis.toUpperCase(), minAxis = "min" + axis.toUpperCase();
            if (current == null)
                current = 0;
            if (value > this[maxAxis] - current)
                return this[maxAxis] - current;
            if (current + value < this[minAxis])
                return this[minAxis] - current;

            return value;
        }

        //Método interno para cargar los parámetros de la gráfica
        function parseParameters(object) {
            var ok = true;

            //Método interno que carga el parámetro data de la clase a partir del parámetro data del objeto. 
            function loadData(object) {

                //Método interno que carga los datos de un array en otro, volcándolos a un elemento { x: 1, y: N } en el caso de que no vengan así.
                function loadArray(theArr, isDateX, isDateY) {
                    var dataArray = [];
                    for (var element in theArr) {
                        if (theArr[element].hasOwnProperty("x") && theArr[element].hasOwnProperty("y"))
                            dataArray[element] = theArr[element];
                        else if (typeof theArr[element] == "number")
                            dataArray[element] = { x: element, y: theArr[element] };
                        if (isDateX)
                            dataArray[element].x = this.temporalUnits[this.unitDateX].parseDate.call(this, dataArray[element].x, "X");
                        if (isDateY)
                            dataArray[element].x = this.temporalUnits[this.unitDateX].parseDate.call(this, dataArray[element].x, "Y");
                    }

                    return dataArray;
                }

                //Data puede ser un array de datos o un array de arrays de datos, en el primer caso debemos convertirlo a un array de arrays.
                //Si el contenido de los elementos finales es un número N, debe convertirse a un objeto de tipo { x: 1 , y: N }
                if (object.data instanceof Array) {
                    if (object.data[0] instanceof Array)
                        for (var graph in object.data)
                            this.data[graph] = loadArray.call(this, object.data[graph], object.isDateX || this.isDateX, object.isDateY
                                || this.isDateY);
                    else
                        this.data[0] = loadArray.call(this, object.data, object.isDateX || this.isDateX, object.isDateY || this.isDateY);
                }
            }

            //Método interno que cambia los valores de ciertos elementos del eje de las X por los del eje de las Y para que se dibuje
            //todo proporcionalmente cuando el layout de la gráfica sea vertical
            function rotateData() {
                var temp;
                temp = this.minX; this.minX = this.minY; this.minY = temp;
                temp = this.maxX; this.maxX = this.maxY; this.maxY = temp;

                var ampX = Math.abs(this.maxX - this.minX), ampY = Math.abs(this.maxY - this.minY) + 1;
                temp = this._unitX; this._unitX = this._unitY; this._unitY = temp;
                temp = this.unitStepX; this.unitStepX = this.unitStepY; this.unitStepY = temp;
                temp = this.isDateX; this.isDateX = this.isDateY; this.isDateY = temp;
                temp = this._dontExtendAxisX; this._dontExtendAxisX = this._dontExtendAxisY; this._dontExtendAxisY = temp;
                temp = this.dateStepX; this.dateStepX = this.dateStepY; this.dateStepY = temp;
                this._unitX = this._graphX / ampX;
                this._unitY = this._graphY / ampY;
                this._offsetIncreaseX = this._unitX * this.unitStepX;
                this._offsetIncreaseY = this._unitY * this.unitStepY;
                this._xCenter0 = this._xCenter - (this.minX * (this._graphX / ampX));
                this._yCenter0 = this._yCenter + (this.minY * (this._graphY / ampY));

                this.barWidth = (object.hasOwnProperty("barWidth") && object.barWidth <= this._offsetIncreaseY) ? object.barWidth
                    : (this.barWidth != undefined && this.barWidth <= this._offsetIncreaseY) ? this.barWidth : this._offsetIncreaseY / 2;

                if (!this._alreadyRotated) {
                    temp = this.labelsX; this.labelsX = this.labelsY; this.labelsY = temp;

                    for (var graph in this.data) {
                        for (var point in this.data[graph]) {
                            temp = this.data[graph][point].x;
                            this.data[graph][point].x = this.data[graph][point].y;
                            this.data[graph][point].y = temp;
                        }
                    }
                }

                this._alreadyRotated = true;
            }

            //Borrado del canvas, ya que puede que no sea la primera vez que se dibuja la gráfica
            this.context.clearRect(0, 0, this.canvasObj.width, this.canvasObj.height);

            this.dateStepX = (object.hasOwnProperty("dateStepX")) ? object.dateStepX : (this.dateStepX) ? this.dateStepX : "days";
            this.dateStepY = (object.hasOwnProperty("dateStepY")) ? object.dateStepY : (this.dateStepY) ? this.dateStepY : "days";
            this.unitDateX = (object.hasOwnProperty("unitDateX")) ? object.unitDateX : (this.unitDateX) ? this.unitDateX : "days";
            this.unitDateY = (object.hasOwnProperty("unitDateY")) ? object.unitDateY : (this.unitDateY) ? this.unitDateY : "days";

            //Si se pasa un diccionario de datos, éste se carga. Si no, en caso de que el diccionario de datos esté vacío se devuelve error
            if (object.hasOwnProperty("data"))
                loadData.call(this, object);
            else if (this.data == [])
                ok = false;
            
            //Se indica que no queremos que el eje x se estire más allá de los valores existentes (en caso de fechas se ignorará)
            this._dontExtendAxisX = true;

            //Llamada al método de la superclase
            this.parseParameters(object);

            this.horizontalLayout = (object.hasOwnProperty("horizontalLayout")) ? object.horizontalLayout : (this.horizontalLayout != undefined)
                ? this.horizontalLayout : true;

            //Cálculo del step para dibujar la cuadrícula y del tamaño de las unidades de la misma en pixels del canvas.
            //Las gráficas de barras tienen la particularidad de que extienden el eje de los elementos una unidad más
            var newGap = Math.abs(this.maxX - this.minX) + 1;
            this._unitX = this._graphX / newGap;
            this._offsetIncreaseX = this._unitX * this.unitStepX;
            
            //Cálculo de la posición del eje de coordenadas, que puede coincidir con el punto inicial de dibujo de la gráfica o no
            this._xCenter0 = this._xCenter - (this.minX * this._unitX);
            this._yCenter0 = this._yCenter + (this.minY * this._unitY);

            this.lineWidth = (object.hasOwnProperty("lineWidth")) ? object.lineWidth : (this.lineWidth) ? this.lineWidth : 0;
            this.borderColor = (object.hasOwnProperty("borderColor")) ? object.borderColor : (this.borderColor) ? this.borderColor : "#000";
            this.grouped = (object.hasOwnProperty("grouped")) ? object.grouped : this.grouped;
            if (!this.grouped && this.data.length > 1) {
                if (!object.hasOwnProperty("maxY"))
                    this.maxY *= this.data.length;
                if (!object.hasOwnProperty("minY") && this.minY < 0)
                    this.minY *= this.data.length;
                var newRange = Math.abs(this.maxY - this.minY);
                if (newRange % this.unitStepY != 0) {
                    if (newRange <= 5)
                        this.unitStepY = 1;
                    else {
                        var candidate = parseInt(newRange / 5);
                        while (newRange % candidate != 0 && candidate != 1)
                            candidate--;
                    }
                    this.unitStepY = candidate;
                }
                this._unitY = this._graphY / Math.abs(this.maxY - this.minY);
                this._offsetIncreaseY = this._unitY * this.unitStepY;
            }
            
            if (!this._originalBarWidth)
                this._originalBarWidth = (object.hasOwnProperty("barWidth") && object.barWidth <= this._offsetIncreaseX) ? object.barWidth
                    : this._offsetIncreaseX / 2;
            this.barWidth = (object.hasOwnProperty("barWidth") && object.barWidth <= this._offsetIncreaseX) ? object.barWidth
                : (this._originalBarWidth && this._originalBarWidth <= this._offsetIncreaseX) ? this._originalBarWidth
                : (this.barWidth && this.barWidth <= this._offsetIncreaseX) ? this.barWidth : this._offsetIncreaseX / 2;
            
            if (this.grouped && this.barWidth * this.data.length >= this._offsetIncreaseX)
                this.barWidth = this._offsetIncreaseX / (this.data.length + 1);
            
            if (!this.horizontalLayout) {
                rotateData.call(this);

                if (this.grouped && this.barWidth * this.data.length >= this._offsetIncreaseY)
                    this.barWidth = this._offsetIncreaseY / (this.data.length + 1);
            }

            this._xGap = (this.grouped) ? Math.abs(this._offsetIncreaseX - (this.data.length * this.barWidth)) / 2
                : Math.abs(this._offsetIncreaseX - this.barWidth) / 2;
            this._yGap = (this.grouped) ? Math.abs(this._offsetIncreaseY - (this.data.length * this.barWidth)) / 2
                : Math.abs(this._offsetIncreaseY - this.barWidth) / 2;

            return ok;
        }

        //Carga de los parámetros de la gráfica
        if (!parseParameters.call(this, object)) {
            alert("No ha podido cargarse la colección de datos para representar la gráfica.");
            return;
        }

        //Gestión de eventos en la gráfica
        if (!this.disableEvents)
            this.loadEventHandlers(object);

        //Dibujado de la retícula de la gráfica, se indica un valor extra en el eje de las etiquetas para que se marque el número superior.
        if (this.horizontalLayout) {
            this.maxX++;
            this.drawReticle();
            this.maxX--;
        } else {
            this.maxY++;
            this.drawReticle();
            this.maxY--;
        }
        
        //Código que dibuja las barras, agrupadas, sin agrupar, en horizontal o en vertical dependiendo de los parámetros grouped y horizonalLayout
        var cumulativeArray = [];

        for (var graph in this.data) {
            if (this.grouped) {
                for (var bar in this.data[graph]) {
                    var x = this.data[graph][bar].x, y = this.data[graph][bar].y;
                    this.context.fillStyle = (this.colors.length > graph) ? this.colors[graph] : "#000";
                    if (this.horizontalLayout) {
                        if (x >= this.minX && x <= this.maxX) {
                            var currentY = getCurrentValue.call(this, y, "y");
                            this.context.fillRect(this._xCenter + ((x - this.minX) * this._offsetIncreaseX) + this._xGap
                                + (graph * this.barWidth), this._yCenter0, this.barWidth, -this._unitY * currentY);
                            if (this.lineWidth > 0) {
                                this.context.lineWidth = this.lineWidth;
                                this.context.strokeStyle = this.borderColor;
                                this.context.strokeRect(this._xCenter + ((x - this.minX) * this._offsetIncreaseX) + this._xGap
                                    + (graph * this.barWidth), this._yCenter0, this.barWidth, -this._unitY * currentY);
                            }
                        }
                    } else {
                        if (y >= this.minY && y <= this.maxY) {
                            var currentX = getCurrentValue.call(this, x, "x");
                            this.context.fillRect(this._xCenter0 + 1, this._yCenter - ((y - this.minY) * this._offsetIncreaseY)
                                - this._yGap - (graph * this.barWidth), this._unitX * currentX, -this.barWidth);
                            if (this.lineWidth > 0) {
                                this.context.lineWidth = this.lineWidth;
                                this.context.strokeStyle = this.borderColor;
                                this.context.strokeRect(this._xCenter0 + 1, this._yCenter - ((y - this.minY) * this._offsetIncreaseY)
                                    - this._yGap - (graph * this.barWidth), this._unitX * currentX, -this.barWidth);
                            }
                        }
                    }
                }
            } else {
                for (var bar in this.data[graph]) {
                    var x = this.data[graph][bar].x, y = this.data[graph][bar].y;
                    this.context.fillStyle = (this.colors.length > graph) ? this.colors[graph] : "#000";
                    if (this.horizontalLayout) {
                        if (x >= this.minX && x <= this.maxX) {
                            cumulativeArray[x] = cumulativeArray[x] || 0;
                            var currentY = getCurrentValue.call(this, y, "y", cumulativeArray[x]);
                            this.context.fillRect(this._xCenter + ((x - this.minX) * this._offsetIncreaseX) + this._xGap, this._yCenter0
                                - (this._unitY * cumulativeArray[x]), this.barWidth, -this._unitY * currentY);
                            if (this.lineWidth > 0) {
                                this.context.lineWidth = this.lineWidth;
                                this.context.strokeStyle = this.borderColor;
                                this.context.strokeRect(this._xCenter + ((x - this.minX) * this._offsetIncreaseX) + this._xGap, this._yCenter0
                                    - (this._unitY * cumulativeArray[x]), this.barWidth, -this._unitY * currentY);
                            }
                            cumulativeArray[x] += currentY;
                        }
                    } else {
                        if (y >= this.minY && y <= this.maxY) {
                            cumulativeArray[y] = cumulativeArray[y] || 0;
                            var currentX = getCurrentValue.call(this, x, "x", cumulativeArray[y]);
                            this.context.fillRect(this._xCenter0 + (this._unitX * cumulativeArray[y]) + 1, this._yCenter
                                - ((y - this.minY) * this._offsetIncreaseY) - this._yGap, this._unitX * currentX, -this.barWidth);
                            if (this.lineWidth > 0) {
                                this.context.lineWidth = this.lineWidth;
                                this.context.strokeStyle = this.borderColor;
                                this.context.strokeRect(this._xCenter0 + (this._unitX * cumulativeArray[y]) + 1, this._yCenter
                                    - ((y - this.minY) * this._offsetIncreaseY) - this._yGap, this._unitX * currentX, -this.barWidth);
                            }
                            cumulativeArray[y] += currentX;
                        }
                    }
                }
            }
        }

        //Se dibuja el eje de coordenadas
        this.drawAxis();
    }

    //Método que define el comportamiento por defecto del evento onMouseHover de la gráfica de Barras.
    BarGraph.prototype.MouseHover = function (element, event) {
        var left = (event.pageX || (event.clientX + scrollLeft)) + 10;
        var top = event.pageY || (event.clientY + scrollTop);
        this.layer.innerHTML = "Val: " + ((this.horizontalLayout) ? element.y : element.x);
        this.layer.style.left = left + "px";
        this.layer.style.top = top + "px";
        this.layer.style.display = "block";
    }

    //Método que define el comportamiento por defecto del evento onMouseOut de la gráfica de Barras
    BarGraph.prototype.MouseOut = function (element, event) {
        this.layer.style.display = "none";
    }

    //Método que define el comportamiento por defecto del evento onClick de la gráfica de Barras
    BarGraph.prototype.Click = function () {
    }

    //Método que define si un punto de coordenadas del canvas se corresponde con un elemento de la gráfica de Barras
    BarGraph.prototype.isInside = function (coords, point, graph, bar) {
        var offsetToBar, offsetValue = 0, offsetValueToBar, barValue, barHeight;

        if (this.horizontalLayout) {
            if (point.x < this.minX || point.x > this.maxX)
                return false;

            offsetToBar = this._xCenter0 + (this._offsetIncreaseX * point.x) + this._xGap;
            if (!this.grouped)
                for (var currentGraph = 0; currentGraph < graph; currentGraph++)
                    offsetValue += this.data[currentGraph][bar].y;
            else
                offsetToBar += this.barWidth * graph;
            offsetValue = (offsetValue > this.maxY) ? this.maxY : (offsetValue < this.minY) ? this.minY : offsetValue;
            offsetValueToBar = this._yCenter0 - (offsetValue * this._unitY);
            barValue = (offsetValue + point.y > this.maxY) ? this.maxY - offsetValue : (offsetValue + point.y < this.minY)
                ? this.minY - offsetValue : point.y;
            barHeight = barValue * this._unitY;
            return (offsetToBar <= coords.x && offsetToBar + this.barWidth >= coords.x && ((barValue >= 0 && (offsetValueToBar >= coords.y
                && offsetValueToBar - barHeight <= coords.y)) || (barValue < 0 && (offsetValueToBar <= coords.y && offsetValueToBar - barHeight
                >= coords.y))));
        } else {
            if (point.y < this.minY || point.y > this.maxY)
                return false;

            offsetToBar = this._yCenter0 - (this._offsetIncreaseY * point.y) - this._yGap;
            if (!this.grouped)
                for (var currentGraph = 0; currentGraph < graph; currentGraph++)
                    offsetValue += this.data[currentGraph][bar].x;
            else
                offsetToBar -= this.barWidth * graph;
            offsetValue = (offsetValue > this.maxX) ? this.maxX : (offsetValue < this.minX) ? this.minX : offsetValue;
            offsetValueToBar = this._xCenter0 + (offsetValue * this._unitX);
            barValue = (offsetValue + point.x > this.maxX) ? this.maxX - offsetValue : (offsetValue + point.x < this.minX)
                ? this.minX - offsetValue : point.x;
            barHeight = barValue * this._unitX;
            return (offsetToBar >= coords.y && offsetToBar - this.barWidth <= coords.y && ((barValue >= 0 && (offsetValueToBar <= coords.x
                && offsetValueToBar + barHeight >= coords.x)) || (barValue < 0 && (offsetValueToBar >= coords.x && offsetValueToBar + barHeight
                <= coords.x))));
        }
    }

    //Fin de clase de gráficas de barras----------------------------------------------------------------------------------------------

    //Clase de gráficas de sectores---------------------------------------------------------------------------------------------------
    function SectorGraph(parentDiv) {
        Graph.call(this, parentDiv);
    }

    //Herencia del prototipo de la clase padre
    SectorGraph.prototype = Object.create(Graph.prototype);

    SectorGraph.prototype.draw = function (object) {

        //Método interno que dibuja la leyenda de la gráfica
        function drawLegend() {
            this.context.font = this._font;

            //Si la gráfica lleva título se dibuja también.
            if (this.title != null) {
                this.context.textAlign = "center";
                this.context.fillText(this.title, this.canvasObj.width / 2, (this.paddingHeight + 10) / 2);
            }

            if (this.legend.length > 0) {
                this._legendDotSize = (this.radius * 10) / this._originalRadius;
                this.context.textBaseline = "top";
                this.context.textAlign = "left";
                var legendX = this._xCenter + this.radius + ((this.canvasObj.width - this.paddingWidth - this._xCenter - this.radius) / 2);
                var legendY = this.canvasObj.height - this.paddingHeight;
                for (var legendElement in this.legend) {
                    this.context.fillStyle = this.colors[legendElement % this.colors.length];
                    this.context.fillRect(legendX, legendY, this._legendDotSize, this._legendDotSize);
                    this.context.fillStyle = "#000";
                    this.context.fillText(this.legend[legendElement], legendX + (this._legendDotSize * 2), legendY);
                    legendY -= (this._legendDotSize * 2);
                }
            }
        }

        //Método interno específico para la carga de los parámetros de la gráfica a dibujar.
        function parseParameters(object) {
            var ok = true;

            //Método interno que carga el parámetro data de la clase a partir del parámetro data del objeto, y el ratio a aplicar a los valores en
            //base a estos mismos. 
            function loadData(object) {
                this._ratio = 0;

                //Data tiene que ser un número o un array de valores numéricos.
                if (object.data instanceof Array) {
                    for (var number in object.data)
                        if (typeof object.data[number] == "number") {
                            this.data[number] = object.data[number];
                            this._ratio += object.data[number];
                        }
                } else if (typeof object.data == "number") {
                    this.data[0] = object.data;
                    this._ratio += object.data[number];
                }
                this._ratio = (2 * Math.PI) / this._ratio;
            }

            //Borrado del canvas, ya que puede que no sea la primera vez que se dibuja la gráfica
            this.context.clearRect(0, 0, this.canvasObj.width, this.canvasObj.height);

            //Indicación de que no hace falta calcular límites ni rangos de ejes
            this._dontExtendAxisX = true;
            this._dontExtendAxisY = true;

            //Si se pasa un diccionario de datos, éste se carga. Si no, en caso de que el diccionario de datos esté vacío se devuelve error
            if (object.hasOwnProperty("data"))
                loadData.call(this, object);
            else if (this.data == [])
                ok = false;

            //Llamada al método de la superclase
            this.parseParameters(object);

            //Carga de parámetros específicos para la clase de sectores
            var maxRad = Math.min(this._graphX, this._graphY) / 2;
            if (!this._originalRadius)
                this._originalRadius = (object.hasOwnProperty("radius") && object.radius <= maxRad) ? object.radius : maxRad;
            if (!this._originalRingRatio)
                this._originalRingRatio = (object.hasOwnProperty("ringWidth") && object.ringWidth < maxRad)
                    ? object.ringWidth / this._originalRadius : 0;
            this.radius = (object.hasOwnProperty("radius") && object.radius <= maxRad) ? object.radius
                : (this._originalRadius != undefined && this._originalRadius <= maxRad) ? this._originalRadius : maxRad;
            this.radius *= this._aspectRatio;
            this._ringRatio = (object.hasOwnProperty("ringWidth") && object.ringWidth < this.radius) ? object.ringWidth / this.radius
                : (this._originalRingRatio != undefined && this._originalRingRatio < 1) ? this._originalRingRatio
                : (this._ringRatio != undefined && this._ringRatio < 1) ? this._ringRatio : 0;
            this.percentage = (object.hasOwnProperty("percentage")) ? object.percentage : (this.percentage != undefined) ? this.percentage : false;
            this.borderColor = (object.hasOwnProperty("borderColor")) ? object.borderColor : (this.borderColor != undefined) ? this.borderColor
                : "#fff";
            this.lineWidth = (object.hasOwnProperty("lineWidth")) ? object.lineWidth : (this.lineWidth != undefined) ? this.lineWidth : 1;
            this.showLabels = (object.hasOwnProperty("showLabels")) ? object.showLabels : (this.showLabels != undefined) ? this.showLabels : true;

            //Reubicación del centro de la gráfica. Las gráficas de sectores tendrán el centro en el punto central del canvas.
            this._xCenter = this.paddingWidth + (this._graphX / 2);
            this._yCenter = this.paddingHeight + (this._graphY / 2);
            this._xCenter0 = this._xCenter;
            this._yCenter0 = this._yCenter;

            if (this.colors.length < 2)
                this.colors[0] = "#F00"; this.colors[1] = "#0F0";

            return ok;
        }

        //Carga de los parámetros del objeto
        if (!parseParameters.call(this, object)) {
            alert("No ha podido cargarse la colección de datos para representar la gráfica");
            return;
        }

        //Carga de los handlers de eventos
        if (!this.disableEvents)
            this.loadEventHandlers(object);

        //Dibujo de la leyenda y el título
        drawLegend.call(this);

        var currentAngle = 0, bisectrizAngle = 0, angleTo;
        this.context.strokeStyle = this.borderColor;
        this.context.lineWidth = this.lineWidth;
        this.context.moveTo(this._xCenter0, this._yCenter0);
        for (var sector in this.data) {
            bisectrizAngle = currentAngle + (this.data[sector] * this._ratio / 2);
            this.context.beginPath();
            this.context.moveTo(this._xCenter0, this._yCenter0);
            angleTo = currentAngle + (this.data[sector] * this._ratio);
            this.context.fillStyle = this.colors[sector % this.colors.length];
            this.context.arc(this._xCenter0, this._yCenter0, this.radius, currentAngle, angleTo);
            currentAngle = angleTo;
            this.context.fill();
            this.context.stroke();
            this.context.closePath();

            //Etiquetas
            if (this.showLabels) {
                var porcentaje = Math.round(this.data[sector] * this._ratio * 5000 / Math.PI) / 100;
                if (porcentaje > 0.5) {
                    this.context.textAlign = (bisectrizAngle >= Math.PI / 2 && bisectrizAngle <= 3 * Math.PI / 2) ? "right" : "left";
                    this.context.textBaseline = ((bisectrizAngle >= 0 && bisectrizAngle <= Math.PI / 4) || (bisectrizAngle >= 3 * Math.PI / 4
                        && bisectrizAngle <= 5 * Math.PI / 4) || (bisectrizAngle >= 7 * Math.PI / 4)) ? "middle" : (bisectrizAngle <= Math.PI)
                        ? "top" : "bottom";
                    this.context.fillStyle = "#000";
                    this.context.fillText((this.labelsX != null && this.labelsX.length > sector) ? this.labelsX[sector] : (this.percentage)
                        ? porcentaje + " %" : this.data[sector], this._xCenter0 + (Math.cos(bisectrizAngle) * (this.radius + 5)), this._yCenter0
                        + (Math.sin(bisectrizAngle) * (this.radius + 5)));
                }
            }
        }

        //Si hay un radio interno se limpia un círculo de radio el indicado para generar una gráfica con forma de aro
        if (this._ringRatio && this._ringRatio > 0) {
            this.context.fillStyle = "#fff";
            this.context.beginPath();
            this.context.arc(this._xCenter0, this._yCenter0, this.radius - (this.radius * this._ringRatio), 0, Math.PI * 2);
            this.context.fill();
            this.context.closePath();
        }
    }

    //Método que define la funcionalidad por defecto del evento MouseOver de las gráficas de Sectores
    SectorGraph.prototype.MouseHover = function (element, event) {
        var left = (event.pageX || (event.clientX + scrollLeft)) + 10;
        var top = event.pageY || (event.clientY + scrollTop);
        this.layer.innerHTML = "Val: " + ((this.percentage) ? element : Math.round(element * this._ratio * 5000 / Math.PI) / 100 + " %");
        this.layer.style.left = left + "px";
        this.layer.style.top = top + "px";
        this.layer.style.display = "block";
    }

    //Método que define la funcionalidad por defecto del evento onMouseOut de las gráficas de Sectores
    SectorGraph.prototype.MouseOut = function () {
        this.layer.style.display = "none";
    }

    //Método que define la funcionalidad por defecto del evento onClick de las gráficas de Sectores
    SectorGraph.prototype.Click = function () {
    }

    //Método que indica si un punto de coordenadas del canvas se corresponde con un elemento de la gráfica de Sectores
    SectorGraph.prototype.isInside = function (coords, element, numSector) {
        var initialAngle = 0;
        //Se calcula la distancia del centro de la gráfica al punto que se está investigando.
        var distance = Math.sqrt(Math.pow(this._xCenter0 - coords.x, 2) + Math.pow(this._yCenter0 - coords.y, 2))
        var innerRadius = (!this._ringRatio) ? 0 : this.radius - (this.radius * this._ringRatio);
        if (distance <= this.radius && distance >= innerRadius) {
            for (var currentSector = 0; currentSector < numSector; currentSector++)
                initialAngle += (this.data[currentSector] * this._ratio);
            var finalAngle = initialAngle + (this.data[numSector] * this._ratio);
            var quadrantAngle = 0;
            var circleAngle = 0;
            quadrantAngle = Math.acos((this._xCenter0 - coords.x) / distance);
            circleAngle = (coords.y <= this._yCenter0) ? Math.PI + quadrantAngle : Math.PI - quadrantAngle;
            return (initialAngle <= circleAngle && finalAngle >= circleAngle);
        } else
            return false;
    }

    //Fin de clase de gráficas de sectores--------------------------------------------------------------------------------------------

    //Clase de gráficas de diagramas de Gantt-----------------------------------------------------------------------------------------
    function GanttGraph(parentDiv) {
        Graph.call(this, parentDiv);
    }

    GanttGraph.prototype = Object.create(Graph.prototype);

    //Método que dibuja gráficas de Gantt
    GanttGraph.prototype.draw = function (object) {

        //Método interno para la carga de datos. 
        function parseParameters(object) {
            var ok = true;

            //Método interno que recorre el array de datos, comprobando que cada elemento tiene start y end, eliminando aquellos que no tienen uno
            //de los dos campos, y añadiendo un type: 0 en aquellos objetos que no tengan type.
            function loadData(object) {

                function processElement(object, element, order) {

                    if (object.hasOwnProperty("start") && object.hasOwnProperty("end")) {
                        this.data[element][order] = object;

                        //Los valores del array deben ser números o fechas
                        if (isNaN(this.data[element][order].start))
                            this.data[element][order].start = this.temporalUnits[this.unitDateX].parseDate.call(this, this.data[element][order].
                                start, "X");
                            
                        if (isNaN(this.data[element][order].end))
                            this.data[element][order].end = this.temporalUnits[this.unitDateX].parseDate.call(this, this.data[element][order].
                                end, "X");

                        //Si tras parsear el elemento el inicio o el final aún no son números, debe eliminarse el elemento.
                        if (isNaN(this.data[element][order].start) || isNaN(this.data[element][order].end))
                            delete this.data[element][order];
                        else {
                            //Ajuste para compatibilizar el objeto con la clase padre
                            this.data[element][order].y = element;
                            this.data[element][order].x = (order == 0) ? this.data[element][order].start : this.data[element][order].end;

                            //Asignación de un tipo si no existiera en los datos que se han pasado
                            if (!this.data[element][order].hasOwnProperty("type"))
                                this.data[element][order].type = 0;

                            return ++order;
                        }
                    }

                    return order;
                }

                if (object.data instanceof Array) {
                    for (var element in object.data) {
                        this.data[element] = [];
                        if (object.data[element] instanceof Array) {
                            var validElement = 0;
                            for (var space in object.data[element])
                                validElement = processElement.call(this, object.data[element][space], element, validElement);
                        } else
                            processElement.call(this, object.data[element], element, 0);
                    }
                }
            }

            this.dateStepX = (object.hasOwnProperty("dateStepX")) ? object.dateStepX : (this.dateStepX) ? this.dateStepX : "days";
            this.dateStepY = (object.hasOwnProperty("dateStepY")) ? object.dateStepY : (this.dateStepY) ? this.dateStepY : "days";
            this.unitDateX = (object.hasOwnProperty("unitDateX")) ? object.unitDateX : (this.unitDateX) ? this.unitDateX : "days";
            this.unitDateY = (object.hasOwnProperty("unitDateY")) ? object.unitDateY : (this.unitDateY) ? this.unitDateY : "days";

            //Si se pasa un diccionario de datos, éste se carga. Si no, en caso de que el diccionario de datos esté vacío se devuelve error
            if (object.hasOwnProperty("data"))
                loadData.call(this, object);
            else if (this.data == [])
                ok = false;
            
            //Llamada al método de la superclase
            this.parseParameters(object);

            //Cuando el eje X representa fechas debe extenderse hasta el siguiente día para hacer que el límte superior sea autoinclusivo
            if (this.isDateX && !this._alreadyLoaded) {
                this.maxX++;
                var newGap = Math.abs(this.maxX - this.minX);
                this._unitX = this._graphX / newGap;
                this._offsetIncreaseX = this._unitX * this.unitStepX;
                this._alreadyLoaded = true;
            }

            //Carga de parámetros específicos de la clase de diagramas de Gantt
            var barRatio = this._graphY / this.data.length;
            this.barWidth = (object.hasOwnProperty("barWidth") && object.barWidth <= barRatio) ? object.barWidth
                : (this.barWidth != undefined && this.barWidth <= barRatio) ? this.barWidth : Math.min(barRatio, 50);
            this.borderColor = (object.hasOwnProperty("borderColor")) ? object.borderColor : (this.borderColor != undefined) ? this.borderColor
                : "#000";
            this.lineWidth = (object.hasOwnProperty("lineWidth")) ? object.lineWidth : (this.lineWidth != undefined) ? this.lineWidth : 0;

            return ok;
        }

        //Borrado del canvas, ya que puede que no sea la primera vez que se dibuja la gráfica
        this.context.clearRect(0, 0, this.canvasObj.width, this.canvasObj.height);

        //Carga de los parámetros del objeto
        if (!parseParameters.call(this, object)) {
            alert("No ha podido cargarse la colección de datos para representar la gráfica");
            return;
        }

        //Dibujado de la retícula
        this.drawReticle(object);

        //Carga de los eventos
        if (!this.disableEvents)
            this.loadEventHandlers(object);

        //Se recorre el array de datos montando las barras del diagrama.
        var yOffset = this._graphY / this.data.length;
        for (var element in this.data) {
            for (var bar in this.data[element]) {
                var start = (this.data[element][bar].start > this.maxX) ? this.maxX : (this.data[element][bar].start > this.minX)
                    ? this.data[element][bar].start : this.minX;
                var end = (this.data[element][bar].end > this.maxX) ? this.maxX : (this.data[element][bar].end > this.minX)
                    ? this.data[element][bar].end : this.minX;
                var unitsFromMinToStart = start - this.minX;
                var unitsFromMinToEnd = end - this.minX;
                //Para que los límites superiores de los diagramas de fechas sean autoinclusivos hay que sumar uno al valor de la barra 
                if (this.isDateX && end < this.maxX)
                    unitsFromMinToEnd++;
                if (unitsFromMinToEnd - unitsFromMinToStart > 0) {
                    this.context.fillStyle = (this.colors.length > this.data[element][bar].type) ? this.colors[this.data[element][bar].type]
                        : "#F00";
                    this.context.fillRect(this._xCenter + (this._unitX * unitsFromMinToStart), this._yCenter - (element * yOffset) - (yOffset / 2)
                        - (this.barWidth / 2), (unitsFromMinToEnd - unitsFromMinToStart) * this._unitX, this.barWidth);
                    if (this.lineWidth > 0) {
                        this.context.lineWidth = this.lineWidth;
                        this.context.strokeStyle = this.borderColor;
                        this.context.strokeRect(this._xCenter + (this._unitX * unitsFromMinToStart), this._yCenter - (element * yOffset)
                            - (yOffset / 2) - (this.barWidth / 2), (unitsFromMinToEnd - unitsFromMinToStart) * this._unitX, this.barWidth);
                    }
                }
            }
        }

        //Se dibuja el eje de coordenadas
        this.drawAxis();
    }

    //Método que define el funcionamiento por defecto del evento onMouseHover en las gráficas de Gantt
    GanttGraph.prototype.MouseHover = function (element, event) {
        var language = window.navigator.userLanguage || window.navigator.language;
        var left = (event.pageX || (event.clientX + scrollLeft)) + 10;
        var top = event.pageY || (event.clientY + scrollTop);
        if (this.isDateX)
            this.layer.innerHTML = "[" + new Date(element.start * 86400000).toLocaleDateString(language,
                { day: "2-digit", month: "2-digit", year: "numeric" }) + ", " + new Date(element.end * 86400000).toLocaleDateString(language,
                { day: "2-digit", month: "2-digit", year: "numeric" }) + "]";
        else
            this.layer.innerHTML = "[" + element.start + ", " + element.end + "]";
        this.layer.style.left = left + "px";
        this.layer.style.top = top + "px";
        this.layer.style.display = "block";
    }

    //Método que define el funcionamiento por defecto del evento onMouseOut en las gráficas de Gantt
    GanttGraph.prototype.MouseOut = function (element, event) {
        this.layer.style.display = "none";
    }

    //Método que define el funcionamiento por defecto del evento onClick en las gráficas de Gantt
    GanttGraph.prototype.Click = function (element, event) {
    }

    //Método que retorna cierto o falso si un punto de coordenadas de la pantalla se corresponde con un elemento del gráfico de Gantt
    GanttGraph.prototype.isInside = function (coords, point, graph, bar) {
        var offsetToBar, start, end, yGap, unitsFromMinToStart, unitsFromMinToEnd;
        yGap = this._graphY / this.data.length;
        offsetToBar = this._yCenter - (yGap * graph) - (yGap / 2) + (this.barWidth / 2);
        start = (point.start > this.maxX) ? this.maxX : (point.start > this.minX) ? point.start : this.minX;
        end = (point.end > this.maxX) ? this.maxX : (point.end > this.minX) ? point.end : this.minX;
        unitsFromMinToStart = start - this.minX;
        unitsFromMinToEnd = end - this.minX;
        if (this.isDateX && end < this.maxX)
            unitsFromMinToEnd++;
        return (offsetToBar >= coords.y && offsetToBar - this.barWidth <= coords.y && this._xCenter + (unitsFromMinToStart * this._unitX)
            <= coords.x && this._xCenter + (unitsFromMinToEnd * this._unitX) >= coords.x);
    }
    //Fin de la clase de gráficas de diagramas de Gantt-------------------------------------------------------------------------------
}
