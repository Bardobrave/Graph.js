////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//Librerí­a tools.js.
//  
//   En esta librerí­a se implementan diferentes herramientas para utilizar con las fichas de datos particulares:
//
//   Módulo images: clase que gestiona la integración de imágenes en una ficha de datos particulares.
//   Módulo validator: clase que gestiona la adición de reglas de validación a objetos específicos.
//   Módulo copyDownloader: clase que permite construir botones que descarguen la copia/remisión de expedientes relacionados.
//   Módulo tabManager: clase que incorpora métodos para gestionar pestañas
//
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var toolsVersion = 1.01;
console.log("Cargando librerí­a tools.js " + toolsVersion + "...");

//La clase copyDownloader añade un botón al sistema que permita ejecutar el código de descarga de la copia de un expediente relacionado.
var _ayg_copyDownloader = function () {
	return {
		initialize: function (container) {
			container.insertAdjacentHTML('beforeend', "<div id=\"_ayg_copyDownloader_button\">Descargar copia</div>");
			var myButton = document.getElementById("_ayg_copyDownloader_button");
			var expDboid = document.getElementById("dboid");
			myButton.addEventListener("click", function() {
				sqlGetCopyDboid = "select DISTINCT a.DBOID, fecha_log "
					+ "from til_exp_expedientes e "
					+ "inner join til_exp_expedientes_rel r on e.dboid = r.exp_expedientes_id "
					+ "inner join til_exp_expedientes e2 on e2.dboid = r.exp_expedientes_rel_id "
					+ "inner join til_exp_actuaciones a on e2.dboid = a.exp_expedientes_id "
					+ "inner join til_exp_tipos_actuacion ta on ta.dboid = a.exp_tipos_act_id and ta.codigo = 'COPIA_REMISION' "
					+ "where e.dboid = " + expDboid.value + " "
					+ "order by fecha_log desc"
				datpar.getAlmacen().ejecutarSQL(sqlGetCopyDboid, function(result) {
					if (result.numElementos() != 0) {
						var actCopyDboid = result.get(0).get("DBOID");
						descargarCopiaRemision(actCopyDboid);
						//window.open("/buroweb/motores/mtrprc/descargarCopiaRemision.do?dboidActuacion='" + actCopyDboid + "'");
					}
				});
			});
		}
	}
}();

//La clase validator gestiona la adición de reglas de validación a objetos especí­ficos
var _ayg_validator = function() {
	return {
		addValidacion: function (field, validationFunction, errorMessage) {
			var fieldObj = document.getElementById(field);
			fieldObj.addEventListener("change", function() {
				if (!validationFunction.call(this, fieldObj.value) && fieldObj.value != "") {
					alert(errorMessage);
					fieldObj.value = "";
				}
			});
		}
	}
}();


//La clase images gestiona la subida de imágenes en una ficha de datos particulares.
var _ayg_image = function () {
    
    var width = 210, height = 270;
    var imagePath = "http:\\\\10.8.1.181:81\\";
    
    
    //La interfaz devuelve métodos para el uso de imágenes
    return {
        createImageComponent: function (container, idImage, fixedWidth, fixedHeight) {
            
            /*El sistema de carga de imágenes se fundamenta en la creación de tres objetos:
            Un campo asociado al valor de base de datos que se almacena indicando la ruta de la imagen, este objeto lo tendrá que crear el
              programador y tenerlo vinculado a una variable de base de datos de datos particulares.
            Un objeto img que cargará la imagen cuya ruta se almacena en container_input: container_image
            Un "loader" que es un input type="file", que permanecerá oculto, y cuyo evento click se enlazará al click de container_input, se
              utilizará para abrir la ventana de carga de ficheros y asociar el valor que se seleccione al valor de container_input. Este evento 
              onClick estará deshabilitado en modo de sólo visualizacián, con lo que se impide naturalmente la alteración de las imágenes cuando no 
              estamos editando.
            También se accederá puntualmente a la etiqueta <span> que contiene al objeto <img> para asignarle un tamaño mí­nimo.*/
            
            //Se inicializan las variables de dimensiones de la imagen
            width = (fixedWidth != undefined && !isNaN(fixedWidth)) ? fixedWidth : width;
            height = (fixedHeight != undefined && !isNaN(fixedHeight)) ? fixedHeight : height;
            
            //Se carga el objeto con el componente contenedor donde se va a almacenar todo y el componente de imagen con eco en pantalla
            var containerObj = document.getElementById(container);
            var inputObj = document.getElementById(idImage);
            
            if (containerObj == undefined) {
                alert("No se ha indicado un contenedor válido");
                return;
            }
            
            if (inputObj == undefined) {
                alert("No se ha indicado un campo para la persistencia en base de datos válido");
                return;
            }
            
            //Se insertan el loader oculto en el dom y el img, ambos dentro del containerObj
            var loader = document.createElement('input');
            loader.type="file"; 
            loader.id= container + '_loader'; 
            loader.style.visibility = "hidden";
            
            var img = document.createElement('img');
            img.id = container + '_image';
            img.width = width;
            img.height = height;
            
            loader = containerObj.appendChild(loader);
            img = containerObj.appendChild(img);
            
            //Si al cargar la ventana, el campo de imagen no es vací­o, se intenta cargar la imágen asociada
            if (inputObj.value != "") {
                img.src = inputObj.value;
                img.style.height = height;
                img.style.width = width;
            }

            /*Se añade un listener para el evento de cambio de valor del loader (al seleccionar una imagen), se traslada dicho valor al campo de 
            base de datos y a la imagen correspondientes. Desde el momento en que está hecha la gestión, hay que trabajar con la FileSystemAccess API
			para mover el fichero, de su posición actual a la posición definitiva donde deben almacenarse */
            loader.addEventListener("change", function() {
                //La copia del fichero ya no es viable a través de código cliente, hay que habilitar una subida de fichero desde código servidor				

                var destinationUrl = imagePath + this.files[0].name;
                img.src = destinationUrl;
                img.style.height = height;
                img.style.width = width;
                inputObj.value = destinationUrl;
                
                //Necesario para que se grabe la información en base de datos, ya que no se coge directamente el componente fí­sico.
                datpar.set(idImage.substring(idImage.lastIndexOf('$') + 1, idImage.length), destinationUrl); 

            });

            //Se genera un evento que enlaza el click del campo que almacena el valor de la imagen con el click del loader
            inputObj.addEventListener("click", function() { loader.click(); });
        },
        setFilePath: function(path) {
            imagePath = path;
        }
    }
    
}();

//La clase tabManager incorpora métodos para gestionar pestañas
var _ayg_tabManager = function () {
	return {
		/* Función que gestiona la visualización y activación de los tabs de una ficha de datos particulaes.
			screenName: Nombre de la pantalla de datos particulares donde se buscan los tabs
			aTabs: Array de objetos JS con la siguiente estuctura:
			name: String con el texto que se visualiza en la pestaña.
			showHide: 'show' si queremos que el tab se visualice, 'hide' si queremos que se oculte.
			activeOnShow: boolean que indica si queremos que un tab que se mantenga visible se seleccione 
  
			La función recorre el array buscando los tabs que se correspondan con los nombres de pantalla y de tab que se pasan por parámetro,
			y aplica la visualización/ocultación de los tabs y sus campos asociados en función de la info que venga en el objeto aTabs.
  
			La estructura de datos que representa en el DOM los tabs es la siguiente:
			<ul id="PES[nombrePantalla]$[nombrePrimerTab]>
				<li class="sel"> //Esta clase define que es el tab seleccionado
					<a pestanya="PE[nombrePantalla]$[nombreTab]">
						<span>[nombreTab</span>
					</a>
				</li>
			</ul>
     
			Los componentes de cada tab tienen otra estructura diferenciada y fuera del UL, pero todo el objeto es accsible 
			a través de self.ctrl(PE[nombrePantalla]$[nombreTab]
		*/
		manageTabs: function (screenName, aTabs) {
  		  aTabs.forEach(tab => {
			var tabName = tab.name;
			var showHide = tab.showHide;
			var activeOnShow = tab.activeOnShow;
			var currentTab = self.ctrl('PE' + screenName + '$' + tabName);
			var currentTabButton = document.querySelector('li > a[pestanya = "PE' + screenName + '$' + tabName + '"]').parentNode;
			if (showHide == 'hide') {
			  currentTab.mostrar(false);
			  currentTabButton.style.display = 'none';
			  currentTabButton.className = ''; //Por defecto, los tabs que se ocultan dejan de ser los seleccionados
			} else {
			  currentTab.mostrar(true);
			  currentTabButton.style.display = 'block';
			  if (activeOnShow)
				currentTabButton.className = 'sel'; //Si se quiere que un tab que permanezca visible está activo se marca como el seleccionado
			}
		  });
		}
	}
}();

console.log("tools.js cargada");
