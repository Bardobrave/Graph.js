# Graph.js
"Simple" yet powerful js API for graphs drawing

The idea behind this API is to create an easy to use tool for web developers to create graphs on their projects.
The objective is to allow users to create a functional graph just creating an object and passing it data.
I want also allow as many options as I can, so users can fine tune their graphs to the maximum detail possible while maintaining ease of use.

This is yet at an early stage, it's fully functional but it lacks proper testing and a good code cleanup. Feel free to use and play with it, also all feedback will be appreciated, however, keep in mind a lot of work is needed before this becomes a "release".

I'll try to maintain code extensely commented (also, I'll try to comment it in english). When I achieve a final release I'll also provide minified files.

#Features

<ul>
	<li>Library independent, just plain javaScript.</li>
	<li>Graph.js uses HTML5 canvas to draw, so you'll need compatible browsers to use it. It's been tested so far on last versions of Chrome and Firefox.</li>
	<li>Graphs will automatically fit container's width.</li>
	<li>Graphs resize automatically with browser's window, this behaviour can be disabled.</li>
	<li>Graphs capture events for mouse move and click, and accept custom event handlers. Event handling can also be disabled</li>
	<li>Axis with date values use internationalization API to show month and weekday names accordingly to browser language</li>
</ul>

#TO DO List
Here is a brief list of different things that I'd like to add to the API before going on "production"

<ul>
	<li>Titles and legends should position themselves and reserve space depending on fontSize and available space</li>
	<li>System should be able to generate clean error messages when invalid data structures are passed. Actually API already does it, however more testing is needed to ensure enough stability on this matter.</li>
	<li>Some minor fixes and improvements derived from allowing more date data types.</li>
</ul>

# How to use it

You can include into your project the whole library AllGraph.js, or you can include just the files for the graphs you're going to use, being Graph.js mandatory in each page where you want to draw graphs.

This way, if you want to use linear graphs on a page but don't expect to use any other graph type, you can just include Graph.js and LinearGraph.js, while if you want to draw Gantt diagrams you should include Graph.js and GanttGraph.js

Once you have included the files you are ready to add Graphs to your page. Just create an object of the proper type passing it a DOM block-level object that will act as a container and call draw method with an array of data.

Graphs will fit by default to container's width and resize with the window automatically (however you can change those default behaviours).

If you want to change the styles of default mouse move event tooltips you can do it within a css class named "graphTooltip".

#Global Graph options
<table id="Graph_options">
	<thead>
		<tr>
			<th>Option</th>
			<th>Default</th>
			<th>Type</th>
			<th>Description</th>
		</tr>
	</thead>
	
	<tbody>
		<tr>
			<td>colors</td>
			<td>null</td>
			<td>Array</td>
			<td>A String Array with RGB color definitions ("#000", "#FEBD5A", "#d3450E", etc...)</td>
		</tr>
		<tr>
			<td>data</td>
			<td>null</td>
			<td>Object</td>
			<td>Required parameter where Graph data is stored. It can accept different data structures depending on the Graph type. Further explaining
				on each type</td>
		</tr>
		<tr>
			<td>dateStepX</td>
			<td>"days"</td>
			<td>String</td>
			<td>When combined with isDateX true and data date information, this parameter is used to draw stepping marks on the X axis. Graph will
			seek on dateStepX for the strings "seconds", "minutes", "hours", "days", "weeks", "months" and "years", adding to the axis the corresponding marks to each possible stepping according to passed data. Although values like "daysweeksyears" are valid, it's strongly recommended to use any kind of separator between 		stepping values "days|years" "months#weeks" "years$months$weeks$days", etc...
Seconds, minutes, days and weekdays are print on Graph's top, while hours, months and years are printed on Graph's bottom. Also "narrow", "short" and "long" prefixes can be added to the different date types to identify which localized format should be used to representate them</td>
		</tr>
		<tr>
			<td>dateStepY</td>
			<td>"days"</td>
			<td>String</td>
			<td>When combined with isDateY true and data date information, this parameter is used to draw stepping marks on the Y axis. Graph will
			seek on dateStepY for the strings "seconds", "minutes", "hours", "days", "weeks", "months" and "years", adding to the axis the corresponding marks to each possible stepping according to passed data. Although values like "daysweeksyears" are valid, it's strongly recommended to use any kind of separator between 		stepping values "days|years" "months#weeks" "years$months$weeks$days", etc...
Seconds, minutes, days and weekdays are print on Graph's top, while hours, months and years are printed on Graph's bottom. Also "narrow", "short" and "long" prefixes can be added to the different date types to identify which localized format should be used to representate them</td>
		</tr>
		<tr>
			<td>disableEvents</td>
			<td>false</td>
			<td>boolean</td>
			<td>Boolean flag. When it's true, mouse move and click events on Graph's canvas are not set. If you don't have interest in event driven
			behaviour for Graph you should active this flag, as a lot of overhead is avoided by doing so.</td>
		</tr>
		<tr>
			<td>fontFamily</td>
			<td>"Helvetica"</td>
			<td>String</td>
			<td>String containing the font family to apply to text on Graph. It can hold different space separated values and complete family 
			references like "serif" or "sans-serif".</td>
		</tr>
		<tr>
			<td>fontSize</td>
			<td>"11px"</td>
			<td>String</td>
			<td>A string defining the font size to apply to text on Graph. It accept values with and without units.</td>
		</tr>
		<tr>
			<td>fontStyle</td>
			<td>"bold"</td>
			<td>String</td>
			<td>String param to define the style to apply to text on Graph. Possible values are those accepted on CSS "bold", "italic", "underline", 
			etc...</td>
		</tr>
		<tr>
			<td>fontVar</td>
			<td>empty string</td>
			<td>String</td>
			<td>String param to define font variant to apply to text on Graph. Possible values are those accepted on CSS for the attribute font-variant</td>
		</tr>
		<tr>
			<td>isDateX</td>
			<td>false</td>
			<td>boolean</td>
			<td>If it's true Graph will try to parse X axis data values as date values</td>
		</tr>
		<tr>
			<td>isDateY</td>
			<td>false</td>
			<td>boolean</td>
			<td>If it's true Graph will try to parse Y axis data values as date values</td>
		</tr>
		<tr>
			<td>labelsX</td>
			<td>null</td>
			<td>Array</td>
			<td>Array of strings with the labels that will be print on the X axis of Graph. If it's not null the marks derived from unitStepX are
			replaced by this labels. Labels spread proportionally all over the axis.</td>
		</tr>
		<tr>
			<td>labelsY</td>
			<td>null</td>
			<td>Array</td>
			<td>Array of strings with the labels that will be print on the Y axis of Graph. If it's not null the marks derived from unitStepY are
			replaced by this labels. Labels spread proportionally all over the axis.</td>
		</tr>
		<tr>
			<td>legend</td>
			<td>null</td>
			<td>Array</td>
			<td>A String Array who contains text for each legend element. If legend has a different number of elements than data, this option is ignored</td>
		</tr>
		<tr>
			<td>maxX</td>
			<td>Depend on data</td>
			<td>Number</td>
			<td>A number value which will be used as hard limit for X axis maximum value. If it's not passed to the object Graph the value is 
			calculated based on data values for X axis so all values on data can be represented. X axis data values greater than maxX won't be 
			represented on Graph</td>
		</tr>
		<tr>
			<td>maxY</td>
			<td>Depend on data</td>
			<td>Number</td>
			<td>A number value which will be used as hard limit for Y axis maximum values. If it's not passed to the object Graph the value is 
			calculated based on data values for Y axis so all values on data can be represented. Y axis data values greater than maxY won't be 
			represented on Graph</td>
		</tr>
		<tr>
			<td>minX</td>
			<td>Depend on data</td>
			<td>Number</td>
			<td>A number value which will be used as hard limit for X axis minimum values. If it's not passed to the object Graph the value is 
			calculated based on data values for X axis so all values on data can be represented. X axis data values lesser than minX won't be 
			represented on Graph</td>
		</tr>
		<tr>
			<td>minY</td>
			<td>Depend on data</td>
			<td>Number</td>
			<td>A number value which will be used as hard limit for Y axis minimum values. If it's not passed to the object Graph the value is 
			calculated based on data values for Y axis so all values on data can be represented. Y axis data values lesser than minY won't be 
			represented on Graph</td>
		</tr>
		<tr>
			<td>percentage</td>
			<td>false</td>
			<td>boolean</td>
			<td>When set to true, reticules shows "%" characters next to value axis, and event tooltip shows also this character inside it's value. <br/>On SectorGraphs, when set to true, outside the sectors of the SectorGraph the percentage value of each sector is shown, while the numeric value is
			shown on the layer tooltip that shows on mouse over events. When set to false, the labels on the outside of the sectors are the numeric values
			while the values on the event tooltip are the percentage ones.
			</td>
		</tr>
		<tr>
			<td>onClick</td>
			<td>null</td>
			<td>callback</td>
			<td>Function callback to the specific behaviour wanted for click event on Graph elements. This function is fired when the mouse is clicked
			over an element of Graph, API passes two params to the callback: element which is the data object where the click has been made, and event,
			which is the event object being captured by the browser.</td>
		</tr>
		<tr>
			<td>onMouseHover</td>
			<td>null</td>
			<td>callback</td>
			<td>Function callback to the specific behaviour wanted for mouseHover event on Graph elements. This function is fired when the mouse 
			moves over an element of Graph, API passes two params to the callback: element which is the data object whose the mouse is moving over,
			and event, which is the event object being captured by the browser</td>
		</tr>
		<tr>
			<td>onMouseOut</td>
			<td>null</td>
			<td>callback</td>
			<td>Function callback to the specific behaviour wanted for mouseOut event on Graph elements. This function is fired when the mouse moves
			out of an element of Graph, API passes two params to the callback: element which is the data object whose the mouse is moving out,
			and event, which is the event object being captured by the browser.</td>
		</tr>
		<tr>
			<td>paddingHeight</td>
			<td>50</td>
			<td>Number</td>
			<td>Number of pixels that will be used as vertical padding on top and bottom of the Graph. It can be modified if Graph has title 
			and/or legend to fit them.</td>
		</tr>
		<tr>
			<td>paddingWidth</td>
			<td>100</td>
			<td>Number</td>
			<td>Number of pixels that will be used as horizontal padding on each side of the Graph.</td>
		</tr>
		<tr>
			<td>resizable</td>
			<td>true</td>
			<td>boolean</td>
			<td>By default, Graph resizes automatically when browser window is resized, maximized, minimized, screen resolution changes or device
			orientation changes. This implies a complete redraw of Graph with the same params passed on the last drawing. If you don't want/need
			your Graphs to resize dinamically with browser window pass this flag as false.
			When resizing, Graph measures, font sizes, padding distances, etc... are recalculated to fit on screen with the same aspect ratio
			given on the previous drawing</td>
		</tr>
		<tr>
			<td>stepX</td>
			<td>Depend on data</td>
			<td>Number</td>
			<td>A number which represent the amount of X axis units that will separate axis marks. If the axis range isn't divisible by the passed
			value, or if there is no passed value at all, Graph will use the lesser possible number that divides the axis range in equal parts
			and is lesser than the fifth part of the axis range. For example, if we have a Graph with a X axis from 0 to 10 and we define stepX: 3,
			Graph will use a stepX of 2 instead, drawing marks at 2, 4, 6 and 8 values.</td>
		</tr>
		<tr>
			<td>stepY</td>
			<td>Depend on data</td>
			<td>Number</td>
			<td>A number which represent the amount of Y axis units that will separate axis marks. If the axis range isn't divisible by the passed
			value, or if there is no passed value at all, Graph will use the lesser possible number that divides the axis range in equal parts
			and is lesser than the fifth part of the axis range. For example, if we have a Graph with a Y axis from 0 to 10 and we define stepY: 3,
			Graph will use a stepY of 2 instead, drawing marks at 2, 4, 6, and 8 values.</td>
		</tr>
		<tr>
			<td>title</td>
			<td>null</td>
			<td>String</td>
			<td>A title to show on top of Graph. If Graph hasn't enough paddingHeight defined to fit the title this space will be added</td>
		</tr>
		<tr>
			<td>unitDateX</td>
			<td>"days"</td>
			<td>string</td>
			<td>A string that determines, when the X axis representates dates, which will be the unit used to measure data. It accept the following values: "seconds", "minutes", "hours", "days", "months" and "years".</td>
		</tr>
		<tr>
			<td>unitDateY</td>
			<td>"days"</td>
			<td>string</td>
			<td>A string that determines, when the Y axis representates dates, which will be the unit used to measure data. It accept the following values: "seconds", "minutes", "hours", "days", "months" and "years".</td>
		</tr>
		<tr>
			<td>weeksStartsOnSundays</td>
			<td>false</td>
			<td>boolean</td>
			<td>ISO Date specification dictates that weeks starts on mondays, so by default Graph will consider mondays as starting days of the week
			when printing week marks, unless weeksStartsOnSundays is passed as true. In this case sundays will be considered first days of the week</td>
		</tr>
	</tbody>
</table>


#Linear graphs

Specific features:
<ul>
	<li>Linear graphs can accept functions as data, building graphs with the results of applying those functions on a data range</li>
</ul>

<a href="http://jsfiddle.net/bardobrave/Lwqzknba/" target="_blank">Fiddle with examples</a>


<table id="LinearGraph_options">
	<thead>
		<tr>
			<th>Option</th>
			<th>Default</th>
			<th>Type</th>
			<th>Description</th>
		</tr>
	</thead>
	
	<tbody>
		<tr>
			<td>data</td>
			<td>null</td>
			<td>object</td>
			<td>This required parameter define the data collections which LinearGraph will represent. Basic valid objects are:
				<ul>
					<li>Functions returning an Y value for each X passed. Those will be executed between this.minX and this.maxX (or between 0 and
					100 if this.minX and this.maxX are not set) and a standard data structure will be form with the results</li>
					<li>Numeric arrays. Numeric arrays with just one dimension will be transformed to standard data structures where Y axis
					values will be Numeric recorded data and X axis values will be their array order</li>
					<li>Object arrays containing x and y attributes. Arrays of objects containing x and y attributes are valid and directly 
					assimilated into the standard data structure. Other attributes than x and y will remain untouched, being returned with the whole
					object when an event is fired on them.
					<li>Arrays of any of the previous. When a bidimensional array is passed a standard data structure will be formed with each
					of the elements. Each of these structures will represent a different line of data on LinearGraph</li>
				</ul>
				Date values passed to data and parsed through isDateX or isDateY flags will be converted to the number of days between 0 Date and
				the represented value.
				Once data is parsed, the resulting standard structure will be like this: [ [ { x: 1, y: 7, ... }, { x: 2, y: 12, ... }, ... ], 
				[ { x: 27, y: 995, ...}, { x: 29, y: -2150 }, ...] ]
			</td>
		</tr>
		<tr>
			<td>drawPoints</td>
			<td>true</td>
			<td>boolean</td>
			<td>Boolean flag that identifies if each point on LinearGraph data should be represented by a small circle on the canvas. These
			points will be the elements capturing mouse events, as single pixels will be too small to precisely capture them. Events will continue
			showing even if this flag is set to null, but there were no visual reference to the point where event is firing, which can be a bit 
			missleading</td>
		</tr>
		<tr>
			<td>fillPoints</td>
			<td>false</td>
			<td>boolean</td>
			<td>If set to true, drawn points will be painted on the same solid color that the line representing it's data collection. If set to 
			false, points will be hollow (center white, border of the same color of line).</td>
		</tr>
		<tr>
			<td>lineWidth</td>
			<td>1</td>
			<td>Number</td>
			<td>A number defining the width of the lines between each pair of LinearGraph point values</td>
		</tr>
		<tr>
			<td>pointRadius</td>
			<td>3</td>
			<td>Numeric</td>
			<td>Number of pixels of LinearGraph's point radius. If set to 0 points won't be visible, however, to achieve this is better to just
			set drawPoints to false, saving the overhead of drawing 0 radius points on each recorded data point.</td>
		</tr>
	</tbody>
</table>

#Bar Graphs

Specific features:
<ul>
	<li>Graphs can be shown grouped or accumulated</li>
	<li>Graphs can be shown on a vertical or horizontal layout</li>
	<li>Accumulated graphs show somewhat unintuitive results when mixing data with different signs, as bars are added layer by layer and later added bars can completely hide previous ones. I'm not very sure how to fix this... I doubt even this is actually some kind of error... but I'm looking for a way to fix it</li>
</ul>

<a href="http://jsfiddle.net/bardobrave/exqLtyme/" target="_blank">Fiddle with examples (unintuitive different sign bars included)</a>

<table id="BarGraph_options">
	<thead>
		<tr>
			<th>Option</th>
			<th>Default</th>
			<th>Type</th>
			<th>Description</th>
		</tr>
	</thead>
	
	<tbody>
		<tr>
			<td>barWidth</td>
			<td>calculated</td>
			<td>Numeric</td>
			<td>Numeric value that defines the number of pixels which will be used to draw the bars. This is the fixed size of the vars, as it's length
			depends on data values. When a value too big, or not value at all, is passed to this parameter, BarGraph calculates the optimum width
			depending on the layout, the number of elements to show and the BarGraph grouping status.
			When resizing of the screen drives to a barWidth value that doesn't fit on the new resolution, this is recalculated and applied on the new
			drawing.</td>
		</tr>
		<tr>
			<td>borderColor</td>
			<td>"#000"</td>
			<td>String</td>
			<td>String representing a RGB color pattern "#000", "#18B5EF", "#36fE4a", ... which will be used to draw bar borders</td>
		</tr>
		<tr>
			<td>data</td>
			<td>null</td>
			<td>object</td>
			<td>This required parameter define the data collections which BarGraph will represent. Basic valid objects are:
				<ul>
					<li>Numeric arrays. Numeric arrays with just one dimension will be transformed to standard data structures where Y axis
					values will be Numeric recorded data and X axis values will be their array order</li>
					<li>Object arrays containing x and y attributes. Arrays of objects containing x and y attributes are valid and directly 
					assimilated into the standard data structure. Other attributes than x and y will remain untouched, being returned with the whole
					object when an event is fired on them.
					<li>Arrays of any of the previous. When a bidimensional array is passed a standard data structure will be formed with each
					of the elements. Each of these structures will represent a different bar collection on BarGraph</li>
				</ul>
				Date values passed to data and parsed through isDateX or isDateY flags will be converted to the number of days between 0 Date and
				the represented value.
				Once data is parsed, the resulting standard structure will be like this: [ [ { x: 1, y: 7, ... }, { x: 2, y: 12, ... }, ... ], 
				[ { x: 27, y: 995, ...}, { x: 29, y: -2150 }, ...] ]
			</td>
		</tr>
		<tr>
			<td>grouped</td>
			<td>false</td>
			<td>boolean</td>
			<td>Flag who determines if bars will be drawn accumulated or grouped.
				<ul>
					<li>When set to true, bars of each different data collection will be drawn one after another. Each bar on a specific element 
					axis value will share the space of this point, and start on the same value axis point.</li>
					<li>When set to false, bars will be accumulative, which each different data collection drawing it's bars after previous
					collections ones. The effect will be of a single long bar drawn on different colors</li>
				</ul>
				All calculations and adjustments to draw a BarGraph in accumulated or grouped mode will be made by the API, just by changing this
				flag's value
			</td>
		</tr>
		<tr>
			<td>horizontalLayout</td>
			<td>true</td>
			<td>boolean</td>
			<td>When set to true, vertical bars will be arranged horizontally. When set to false, horizontal bars will be arranged vertically.
			Once again, there is no need to change other parameter values or made any extra calculation to change BarGraph layout, every calculation is
			made automatically by the API, making it possible to draw BarGraphs on either layout only changing this flag's value.
			There is a little drawback here. Vertical layout BarGraphs will consider it's X axis on the vertical side, while it's Y axis will be on the
			horizontal one. This means that bars on BarGraphs will always spawn from X axis alongside Y axis. This could seem a bit weird to the 
			unaware user, but allows seamless change from horizontal to vertical layout without further change. Any necessary change is made internally.
			</td>
		</tr>
		<tr>
			<td>lineWidth</td>
			<td>0</td>
			<td>Number</td>
			<td>Numeric value representing the border with of the bars on the BarGraph. If set to 0, bars will be drawn without border</td>
		</tr>
	</tbody>
</table>

#Sector Graphs

Specific features
<ul>
	<li>Sector graphs are only able to represent one data collection at a time</li>
	<li>Information can be shown as a percentage or as a total value</li>
	<li>Graphs can be drawn as pie charts or as ring charts</li>
</ul>

<a href="http://jsfiddle.net/bardobrave/877n46cL/" target="_blank">Fiddle with examples</a>

<table id="SectorGraph_options">

	<thead>
		<tr>
			<th>Option</th>
			<th>Default</th>
			<th>Type</th>
			<th>Description</th>
		</tr>
	</thead>
	
	<tbody>
		<tr>
			<td>borderColor</td>
			<td>"#fff"</td>
			<td>String</td>
			<td>A String containing a RGB color definition ("#fff", "#21ED1A", "#4aeDF2", ...) which will be used to draw the border of the sectors on
			SectorGraph</td>
		</tr>
		<tr>
			<td>data</td>
			<td>null</td>
			<td>object</td>
			<td>This required parameter define the data collections which SectorGraph will represent. Basic valid objects are just numeric arrays,
			as SectorGraphs cannot represent more than one data collection at once and this data collection will have just one dimension.
			</td>
		</tr>
		<tr>
			<td>lineWidth</td>
			<td>1</td>
			<td>Numeric</td>
			<td>The border with in pixels for each sector on the SectorGraph</td>
		</tr>
		<tr>
			<td>radius</td>
			<td>calculated</td>
			<td>Numeric</td>
			<td>The number of pixels for the radius of the SectorGraph. If a value too long or not value at all is passed to the parameter, it's 
			automatically calculated to fit the dimensions of the SectorGraph canvas.
			</td>
		</tr>
		<tr>
			<td>ringWidth</td>
			<td>0</td>
			<td>Number</td>
			<td>If a value greater than 0 is passed, SectorGraph will draw a ring graph instead of a sector one. This parameter will represent the 
			width of the ring. Also, the width is used to calculate a ratio between the outside radius and the inner one, if the window resizes,
			both radius will resize accordingly, maintaining the aspect ratio of the ring although it's actual width changes.</td>
		</tr>
		<tr>
			<td>showLabels</td>
			<td>true</td>
			<td>boolean</td>
			<td>When this flag is set to false, labels outside of sectors are not drawn.</td>
		</tr>
	</tbody>
</table>

#Gantt Diagrams

Specific features:

<ul>
	<li>Graphs can representate different element types on the same Graph</li>
</ul>

<a href="http://jsfiddle.net/bardobrave/b59z2eh4/" target="_blank">Fiddle with examples</a>

<table id="GanttGraph_options">
	<thead>
		<tr>
			<th>Option</th>
			<th>Default</th>
			<th>Type</th>
			<th>Description</th>
		</tr>
	</thead>
	
	<tbody>
		<tr>
			<td>barWidth</td>
			<td>calculated</td>
			<td>Number</td>
			<td>The width in pixels of the GanttGraph bars. If a value too long or not value at all is passed, GanttGraph will calculate the best
			with possible to draw the GanttGraph according to the number of data collections and the length of the element axis.
			</td>
		</tr>
		<tr>
			<td>borderColor</td>
			<td>"#000"</td>
			<td>String</td>
			<td>A String containing a RGB color definition ("#000", "#FED543", "#dBa31F", ...) which determines the color to be used for the border
			of GanttGraph bars</td>
		</tr>
		<tr>
			<td>data</td>
			<td>null</td>
			<td>object</td>
			<td>This required parameter define the data collections which GanttGraph will represent. Basic valid objects are:
				<ul>
					<li>Object arrays containing start and end attributes. Arrays of objects containing start and end attributes are valid and 
					directly assimilated into the standard data structure. Other attributes than start and end will remain untouched, being returned 
					with the whole object when an event is fired on them.
					<li>Arrays of any of the previous. When a bidimensional array is passed a standard data structure will be formed with each
					of the elements. Each of these structures will represent a different Gantt data collection on GanttGraph</li>
				</ul>
				Date values passed to data don't need to be parsed through isDateX or isDateY, and will be converted to the number of days between 0 
				Date and the represented value.
				Once data is parsed, the resulting standard structure will be like this: [ [ { y: 0, start: 22, end: 28 ... }, 
				{ y: 0, start: 34, end: 42 ... }, ... ], [ { y: 1, start: 35, end: 39 ...}, { y: 1, start: 42, end: 45 }, ...] ]
			</td>
		</tr>
		<tr>
			<td>lineWidth</td>
			<td>0</td>
			<td>Number</td>
			<td>The width in pixels of GanttGraph's bar's borders. If a value of 0 is passed bars will be drawn without a separated border</td>
		</tr>
	</tbody>
</table>

#Working with dates

After last changes to the library, it's capable of represent date info on Graphs with more options. Sadly this has also augmented it's complexity of use. I'll try to depict here a brief tutorial about working with dates. I'll try also to put some examples.

First things first. For using date info you'll need to get familiar with three parameters. I'll use on the examples x axis for dates (as it's the most usual), however, every of this parameters has it's Y counterpart:

<ul>
	<li>isDateX: This param simply states that x axis will contain date information</li>
	<li>unitDateX: This is the param that states the temporal unit our Graph will be using</li>
	<li>dateStepX: This param will describe where and how reticule marks should be drawn on the Graph</li>
</ul>

This way, when we want to represent temporal data on one of our axis, we need to do three things: make library aware of it through isDateX, set the temporal unit through unitDateX, and define our reticule through dateStepX.

There are some considerations to keep acount of:

<ul>
	<li>At this moment, when we load temporal data into our Graph, we need to do it passing date as strings with the following format yyyy/mm/dd hh:mm:ss.</li>
	<li>Dates will be treated internally as UTC</li>
	<li>If we select any reticule mark of lesser magnitude than our temporal unit it will be ignored</li>
</ul>

<a href="http://jsfiddle.net/bardobrave/2mo82zz2/" target="_blank">Fiddle with examples</a>
