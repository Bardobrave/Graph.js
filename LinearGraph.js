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
                        dataArray[point].x = Date.parse(dataArray[point].x) / 86400000;
                    if (isDateY)
                        dataArray[point].y = Date.parse(dataArray[point].y) / 86400000;
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
                            this.data[graph] = loadArrayData(object.data[graph], object.isDateX || this.isDateX, object.isDateY || this.isDateY);
                    }
                } else
                    this.data[0] = loadArrayData(object.data, object.isDateX || this.isDateX, object.isDateY || this.isDateY);
            }
        }

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
