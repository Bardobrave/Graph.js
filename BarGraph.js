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
                var myArray = [];
                for (var element in theArr) {
                    if (theArr[element].hasOwnProperty("x") && theArr[element].hasOwnProperty("y"))
                        myArray[element] = theArr[element];
                    else if (typeof theArr[element] == "number")
                        myArray[element] = { x: element, y: theArr[element] };
                    if (isDateX)
                        myArray[element].x = Date.parse(myArray[element].x) / 86400000;
                    if (isDateY)
                        myArray[element].x = Date.parse(myArray[element].y) / 86400000;
                }

                return myArray;
            }

            //Data puede ser un array de datos o un array de arrays de datos, en el primer caso debemos convertirlo a un array de arrays.
            //Si el contenido de los elementos finales es un número N, debe convertirse a un objeto de tipo { x: 1 , y: N }
            if (object.data instanceof Array) {
                if (object.data[0] instanceof Array)
                    for(var graph in object.data)
                        this.data[graph] = loadArray(object.data[graph], object.isDateX || this.isDateX, object.isDateY || this.isDateY);
                else
                    this.data[0] = loadArray(object.data, object.isDateX || this.isDateX, object.isDateY || this.isDateY);
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
                        temp = this.data[graph][point].x; this.data[graph][point].x = this.data[graph][point].y; this.data[graph][point].y = temp;
                    }
                }
            }

            this._alreadyRotated = true;
        }

        //Borrado del canvas, ya que puede que no sea la primera vez que se dibuja la gráfica
        this.context.clearRect(0, 0, this.canvasObj.width, this.canvasObj.height);

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
        if (!this.grouped && !object.hasOwnProperty("maxY") && this.data.length > 1) {
            this.maxY *= this.data.length;
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
