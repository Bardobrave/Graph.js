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
            this._originalRingRatio = (object.hasOwnProperty("ringWidth") && object.ringWidth < maxRad) ? object.ringWidth / this._originalRadius
                : 0;
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
                    && bisectrizAngle <= 5 * Math.PI / 4) || (bisectrizAngle >= 7 * Math.PI / 4)) ? "middle" : (bisectrizAngle <= Math.PI) ? "top"
                    : "bottom";
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
