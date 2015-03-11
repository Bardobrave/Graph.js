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
                        this.data[element][order].start = Date.parse(this.data[element][order].start) / 86400000;

                    if (isNaN(this.data[element][order].end))
                        this.data[element][order].end = Date.parse(this.data[element][order].end) / 86400000;

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
            var daysFromMinToStart = start - this.minX;
            var daysFromMinToEnd = end - this.minX;
            if (daysFromMinToEnd - daysFromMinToStart > 0) {
                this.context.fillStyle = (this.colors.length > this.data[element][bar].type) ? this.colors[this.data[element][bar].type] : "#F00";
                this.context.fillRect(this._xCenter + (this._unitX * daysFromMinToStart), this._yCenter - (element * yOffset) - (yOffset / 2)
                    - (this.barWidth / 2), (daysFromMinToEnd - daysFromMinToStart) * this._unitX, this.barWidth);
                if (this.lineWidth > 0) {
                    this.context.lineWidth = this.lineWidth;
                    this.context.strokeStyle = this.borderColor;
                    this.context.strokeRect(this._xCenter + (this._unitX * daysFromMinToStart), this._yCenter - (element * yOffset) - (yOffset / 2)
                        - (this.barWidth / 2), (daysFromMinToEnd - daysFromMinToStart) * this._unitX, this.barWidth);
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
GanttGraph.prototype.MouseOut = function(element, event) {
    this.layer.style.display = "none";
}

//Método que define el funcionamiento por defecto del evento onClick en las gráficas de Gantt
GanttGraph.prototype.Click = function(element, event) {
}

//Método que retorna cierto o falso si un punto de coordenadas de la pantalla se corresponde con un elemento del gráfico de Gantt
GanttGraph.prototype.isInside = function(coords, point, graph, bar) {
    var offsetToBar, start, end, yGap, daysFromMinToStart, daysFromMinToEnd;
    yGap = this._graphY / this.data.length;
    offsetToBar = this._yCenter - (yGap * graph) - (yGap / 2) + (this.barWidth / 2);
    start = (point.start > this.maxX) ? this.maxX : (point.start > this.minX) ? point.start : this.minX;
    end = (point.end > this.maxX) ? this.maxX : (point.end > this.minX) ? point.end : this.minX;
    daysFromMinToStart = start - this.minX;
    daysFromMinToEnd = end - this.minX;
    return (offsetToBar >= coords.y && offsetToBar - this.barWidth <= coords.y && this._xCenter + (daysFromMinToStart * this._unitX)
        <= coords.x && this._xCenter + (daysFromMinToEnd * this._unitX) >= coords.x);
}
//Fin de la clase de gráficas de diagramas de Gantt-------------------------------------------------------------------------------
