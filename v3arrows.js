// A small directable Arrow overlay for GMaps V3
// Bill Chadwick Feb 2012 after my previous V2 API version
// Free for any use as far as I am concerned 
// Some public domain code VML/SVG utility code of Ben Appleton's is reused at the end of this file


var arrowOverlayMarkerCounter; //unique id counter for SVG arrow head markers

function ArrowOverlay(map, location, rotation, color, opacity, tooltip) {

    this.map_ = map;
    this.location_ = location;
    this.rotation_ = rotation || 0.0;
    
    var r = this.rotation_ + 90; //compass to math
    this.dx_ = 30 * Math.cos(r * Math.PI / 180); //other end of arrow line to point
    this.dy_ = 30 * Math.sin(r * Math.PI / 180);    //both 30s were 20s-- this tripples their size, but eliminates the tail [RC]
    
    this.color_ = color || "#0000FF";
    this.opacity_ = opacity || 0.7;
    this.tooltip_ = tooltip || "";
    
    this.div_ = null;
    this.setMap(map);

    this.handle_ = null;//click event handler handle

    if (arrowOverlayMarkerCounter == null)
        arrowOverlayMarkerCounter = 0;
    else
        arrowOverlayMarkerCounter += 1;
    this.svgId_ = "ArrowOverlay" + arrowOverlayMarkerCounter.toString();

}

ArrowOverlay.prototype = new google.maps.OverlayView();

ArrowOverlay.prototype.onAdd = function() {

    // Create the DIV and set some basic attributes.
    var div = document.createElement('DIV');
    div.title = this.tooltip_;
    //div.style.cursor = "help";

    var obj = this;
    this.handle_ = google.maps.event.addDomListener(div, 'click', function() { google.maps.event.trigger(obj, "click") });

    //set up arrow invariants
    if (supportsVML()) {

        var l = createVmlElement('v:line', div);
        l.strokeweight = "3px";
        l.strokecolor = this.color_;
        l.style.position = 'absolute';
        var s = createVmlElement("v:stroke", l);
        s.opacity = this.opacity_;
        s.startarrow = "classic"; // or "block", "open" etc see VML spec
        this.vmlLine_ = l;
    }
    else {

        // make a 40x40 pixel space centered on the arrow 
        var svgNS = "http://www.w3.org/2000/svg";
        var svgRoot = document.createElementNS(svgNS, "svg");
        svgRoot.setAttribute("width", 120);   //was 40 [RC]
        svgRoot.setAttribute("height", 120);  //was 40 [RC]
        svgRoot.setAttribute("stroke", this.color_);
        svgRoot.setAttribute("fill", this.color_);
        svgRoot.setAttribute("stroke-opacity", this.opacity_);
        svgRoot.setAttribute("fill-opacity", this.opacity_);
        div.appendChild(svgRoot);

        var svgNode = document.createElementNS(svgNS, "line");
        svgNode.setAttribute("stroke-width", 3);
        svgNode.setAttribute("x1", 60);  //was 20 [RC]
        svgNode.setAttribute("y1", 60);  //was 20 [RC]
        svgNode.setAttribute("x2", 60 + this.dx_);  //was 20 [RC]
        svgNode.setAttribute("y2", 60 + this.dy_);  //was 20 [RC]

        //make a solid arrow head, can't share these, as in SVG1.1 they can't get color from the referencing object, only their parent
        //a bit more involved than the VML
        if (this.rotation_ >= 0) {
            var svgM = document.createElementNS(svgNS, "marker");
            svgM.id = this.svgId_;
            svgM.setAttribute("viewBox", "0 0 10 10");
            svgM.setAttribute("refX", 0);
            svgM.setAttribute("refY", 5);
            svgM.setAttribute("markerWidth", 12);  //was 4 [RC]
            svgM.setAttribute("markerHeight", 9);  //was 3 [RC]
            svgM.setAttribute("orient", "auto");
            var svgPath = document.createElementNS(svgNS, "path"); //could share this with 'def' and 'use' but hardly worth it 
            svgPath.setAttribute("d", "M 10 0 L 0 5 L 10 10 z");
            svgM.appendChild(svgPath);
            svgRoot.appendChild(svgM);
            svgNode.setAttribute("marker-start", "url(#" + this.svgId_ + ")");
        }

        svgRoot.appendChild(svgNode);
        this.svgRoot_ = svgRoot;
        this.svgNode_ = svgNode;

    }

    // Set the overlay's div_ property to this DIV
    this.div_ = div;

    var panes = this.getPanes();
    panes.overlayImage.appendChild(this.div_);
    
    this.setVisible(false);  // arrows are hidden by default, but revealed by toggling a checkbox [RC]
}

ArrowOverlay.prototype.draw = function() {

    var overlayProjection = this.getProjection();
    var p = overlayProjection.fromLatLngToDivPixel(this.location_);
    var div = this.div_;
    if (!div)
        return;
    if (!div.style)
        return;

    // Calculate the DIV coordinates of the ref point of our arrow

    var x2 = p.x + this.dx_;
    var y2 = p.y + this.dy_;

    if (supportsVML()) {
        this.vmlLine_.from = p.x + "px, " + p.y + "px";
        this.vmlLine_.to = x2 + "px, " + y2 + "px";
    }
    else {
        this.svgRoot_.setAttribute("style", "position:absolute; top:" + (p.y - 60) + "px; left:" + (p.x - 60) + "px");  // both 60s were 20s [RC]
    }
}

ArrowOverlay.prototype.onRemove = function() {
    if (this.handle_ != null) {
        google.maps.eventclear.removeListener(this.handle_);
    }
    this.div_.parentNode.removeChild(this.div_);
}

ArrowOverlay.prototype.setVisible = function(v) {
    if (v)
        this.show();
    else
        this.hide();
}

ArrowOverlay.prototype.getVisible = function(v) {
    if (this.div_) {
        return (this.div_.style.display == "");
    }
    return false;
}

ArrowOverlay.prototype.hide = function() {
    if (this.div_) {
        this.div_.style.display = "none";
    }
}

ArrowOverlay.prototype.show = function() {
    if (this.div_) {
        this.div_.style.display = "";
    }
}

ArrowOverlay.prototype.setPosition = function(l) {
    this.location_ = l;
    this.draw();
}

ArrowOverlay.prototype.getPosition = function() {
    return this.location_;
}

ArrowOverlay.prototype.setHeading = function(h) {
    this.rotation_ = h || 0.0;
    var r = this.rotation_ + 90; //compass to math
    this.dx_ = 20 * Math.cos(r * Math.PI / 180); //other end of arrow line to point
    this.dy_ = 20 * Math.sin(r * Math.PI / 180);

    if (!supportsVML()) {
        this.svgNode_.setAttribute("x2", 20 + this.dx_);
        this.svgNode_.setAttribute("y2", 20 + this.dy_);
    }
    this.draw();
}

ArrowOverlay.prototype.getHeading = function() {
    return this.rotation_;
}

ArrowOverlay.prototype.setTooltip = function(t) {
    this.tooltip_ = t;
}

ArrowOverlay.prototype.getTooltip = function() {
    return this.tooltip_;
}

ArrowOverlay.prototype.toggle = function() {
    if (this.div_) {
        if (this.div_.style.visibility == "hidden") {
            this.show();
        } else {
            this.hide();
        }
    }
}

ArrowOverlay.prototype.fromDivPixelToLatLng = function(x, y) {
    var overlayProjection = this.getProjection();
    return overlayProjection.fromDivPixelToLatLng(new google.maps.Point(x, y));
}

ArrowOverlay.prototype.fromLatLngToContainerPixel = function(p) {
    var overlayProjection = this.getProjection();
    return overlayProjection.fromLatLngToContainerPixel(p);
}

// SVG utils from here http://appleton-static.appspot.com/static/simple_poly.js
// by Ben Appleton of Google

var SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

function supportsSVG() {
    return document.implementation.hasFeature(
        'http://www.w3.org/TR/SVG11/feature#Shape',
        '1.1');
}

// VML utils from here http://appleton-static.appspot.com/static/simple_poly.js
// by Ben Appleton of Google

var VML_NAMESPACE = 'urn:schemas-microsoft-com:vml';

function createVmlElement(tagName, parent) {
    var element = document.createElement(tagName);
    parent.appendChild(element);
    element.style['behavior'] = 'url(#default#VML)';
    return element;
}

function supportsVML() {
    if (supportsVML.result_ == null) {
        if (!maybeCreateVmlNamespace()) {
            return supportsVML.result_ = false;
        }

        // Create some VML.  Its 'adj' property will be an object only when VML
        // is enabled.
        var div = document.createElement('DIV');
        document.body.appendChild(div);
        div.innerHtml = '<v:shape id="vml_flag1" adj="1" />';
        var child = div.firstChild;
        if (child) child.style['behavior'] = 'url(#default#VML)';
        supportsVML.result_ = !child || (typeof child['adj'] == 'object');
        div.parentNode.removeChild(div);
    }

    return supportsVML.result_;
}

function maybeCreateVmlNamespace() {
    var hasVmlNamespace = false;

    if (document.namespaces) {
        for (var x = 0; x < document.namespaces.length; x++) {
            var ns = document.namespaces(x);
            if (ns.name == 'v') {
                if (ns.urn == VML_NAMESPACE) {
                    hasVmlNamespace = true;
                } else {
                    throw new Error('document namespace v: is required for VML ' +
                            'but has been reserved for ' + ns.urn);
                }
            }
        }
        if (!hasVmlNamespace) {
            // Import namespace
            hasVmlNamespace = true;
            document.namespaces.add('v', VML_NAMESPACE);
        }
    }

    return hasVmlNamespace;
}
