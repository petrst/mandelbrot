
var Mandelbrot = function(canvas){

    // GEOMETRY ----------------------------------------------------------------
    this.init = function(){
        this.canvasWidth  = this.canvas.width;
        this.canvasHeight = this.canvas.height;

        this.realWidth = 4.0;
        this.realHeight = this.realWidth * this.canvasHeight / this.canvasWidth;

        this.ctx = this.canvas.getContext('2d');
        this.imageData = this.ctx.getImageData(0, 0, this.canvasWidth, this.canvasHeight);

        var buf = new ArrayBuffer(this.imageData.data.length);
        this.buf8 = new Uint8ClampedArray(buf);
        this.data = new Uint32Array(buf);
    }

    this.reset = function(){
        this.iter = 100;
        this.centerX = 0.0;
        this.centerY = 0.0;
        this.zoom = 1.0;
    }


    this.canvas2realX= function(posX){
        return this.centerX - this.realWidth / (2.0*this.zoom) 
               + posX * this.realWidth / ( this.zoom * this.canvasWidth );
    }

    this.canvas2realY= function(posY){
        return this.centerY - this.realHeight / (2.0*this.zoom) 
               + posY * this.realHeight / ( this.zoom * this.canvasHeight );
    }

    this.canvas = canvas;
    this.init();
    this.reset();
   
    this.bailout = 4.0;



    //   COLOR MAPING FUNCTIONS --------------------------------------------
    this.logMapping = false;
    this.colorCycling=1;


    var setRgb = function(r,g,b){
        return b +  (g << 8) + (r<<16) + (0xff << 24 );
    };


    var rgb_mapping = new Uint32Array(6);
    rgb_mapping[0] = setRgb(255,0,255);
    rgb_mapping[1] = setRgb(255,0,0);
    rgb_mapping[2] = setRgb(255,255,0);
    rgb_mapping[3] = setRgb(0,255,0);
    rgb_mapping[4] = setRgb(0,255,255);
    rgb_mapping[5] = setRgb(0,0,255);

    var sunset_mapping = new Uint32Array(16);
    sunset_mapping[0]=setRgb(66, 30, 15);
    sunset_mapping[1]=setRgb(25, 7, 26);
    sunset_mapping[2]=setRgb(9, 1, 47);
    sunset_mapping[3]=setRgb(4, 4, 73);
    sunset_mapping[4]=setRgb(0, 7, 100);
    sunset_mapping[5]=setRgb(12, 44, 138);
    sunset_mapping[6]=setRgb(24, 82, 177);
    sunset_mapping[7]=setRgb(57, 125, 209);
    sunset_mapping[8]=setRgb(134, 181, 229);
    sunset_mapping[9]=setRgb(211, 236, 248);
    sunset_mapping[10]=setRgb(241, 233, 191);
    sunset_mapping[11]=setRgb(248, 201, 95);
    sunset_mapping[12]=setRgb(255, 170, 0);
    sunset_mapping[13]=setRgb(204, 128, 0);
    sunset_mapping[14]=setRgb(153, 87, 0);
    sunset_mapping[15]=setRgb(106, 52, 3);

    
    var grayscale_mapping = new Uint32Array(this.iter);
    for(var i=0;i<this.iter;i++){
        var level = Math.round(i*256.0 / this.iter);
        grayscale_mapping[i]= level + (level << 8 ) + (level << 16 ) + (0xff << 24 );
    }

    this.colors = 'Sunset';
    this.colorOffset = 0;

    this.map=function(i){
        var mapping=grayscale_mapping;
        if (this.colors=='Sunset') {
                mapping = sunset_mapping;
        } else if (this.colors=='RGB') {
                mapping = rgb_mapping;
        }


        if (this.logMapping){
            //return mapping[mapping.length-Math.round(mapping.length * Math.log10(i)/Math.log10(this.iter))];
            return mapping[mapping.length - i % mapping.length];
        } else {
            var scale = Math.round(mapping.length * i/this.iter) ;
            return mapping[ mapping.length - scale - 1 ];
        }
    }
    // MOUSE HANDLER --------------------------------------------------------------------
    this.cursorX = 0.0;
    this.cursorY = 0.0;

    this.onClick=function(event){
        var x = event.clientX;
        var y = event.clientY;
        var zoom = 2.0;

        if (event.shiftKey) zoom = 0.5;

        x -= this.canvas.offsetLeft;
        y -= this.canvas.offsetTop;
        this.centerX = this.canvas2realX(x);
        this.centerY = this.canvas2realY(y);
        console.log("New center is "+this.centerX+","+this.centerY);
        this.zoom = this.zoom * zoom;
        this.draw();
    }



    this.onMove=function(event){
        var x = event.clientX;
        var y = event.clientY;

        x -= this.canvas.offsetLeft;
        y -= this.canvas.offsetTop;
        this.cursorX = this.canvas2realX(x);
        this.cursorY = this.canvas2realY(y);
    }

    // CALUCALTION ----------------------------------------------------------------------
    this.renderTime=0.0;
    this.draw = function(){
        console.log('Runing with iter='+this.iter);
        var start = new Date().getTime();
        for (var y = 0; y < this.canvasHeight; ++y) {

            b = ( y - this.canvasHeight / 2.0) * 4.0 / this.canvasHeight;
            b = this.canvas2realY(y);

            for (var x = 0; x < this.canvasWidth; ++x) {
               
                a = ( x - this.canvasWidth / 2.0 ) * 4.0 / this.canvasWidth;          
                a = this.canvas2realX(x);

                var na=a;
                var nb=b;

                for (i=0;i<this.iter;i++){
                    var nna = na*na - nb*nb + a;
                    nb = 2*na*nb + b;
                    na = nna;
                    if ( na*na+nb*nb > this.bailout ){
                        break;

                    }
                }
                if ( i<this.iter ) {
                    this.data[x+y*this.canvasWidth] = this.map(i);
                } else {
                    this.data[x+y*this.canvasWidth] = 0xff000000;
                    //data[x+y*canvasWidth] = colors[i];
                }
                
            }
        }
    
        this.imageData.data.set(this.buf8);
        this.ctx.putImageData(this.imageData, 0, 0);


        this.renderTime = new Date().getTime() - start;
    }
}
