/*globals window */

(function(window)
{
	'use strict';
	
	var wA = window.webAnalytics || {};

    wA.page_data = wA.page_data || {};
    wA.event_data = wA.event_data || {};
    wA.dfa_data = wA.dfa_data || {};
    wA.context_data = wA.context_data || {};
    wA.config_data = wA.config_data || {};

    window.webAnalytics = wA;
	
}(window));
/*global vg, vgDevice, window*/

(function(window) 
{
	'use strict';
	
	/**
	 * Create vgDevice namespace
	 */
	window.vgDevice = window.vgDevice || {};
	
	/**
	 * Create a CustomEvent, and polyfills CustomEvent when browser
	 * does not have CustomEvent support.
	 *
	 * @param type the type of event
	 * @param props properties object {bubble, cancelable, detail}
	 */
	
	vgDevice.CustomEvent = function (type, props) 
	{
		var event;
		props = props || {bubbles: false, cancelable: false, detail: undefined};
		
		try 
		{
			event = document.createEvent('CustomEvent');
			event.initCustomEvent(type, props.bubbles, props.cancelable, props.detail);
		} 
		catch (err) 
		{
			// for browsers which don't support CustomEvent at all, we use a regular event instead
			event = document.createEvent('Event');
			event.initEvent(type, props.bubbles, props.cancelable);
			event.detail = props.detail;
		}
		return event;
	};
	
}(window));

(function (window)
{
	"use strict";
	
	var mobileUA = [
		'iPhone',								//iPhone
		'iPod',									//iPod
		'iPad',									//iPad
		'(?=.*\bAndroid\b)(?=.*\bMobile\b)',	//Android Phone
		'Android',								//Android Tablet
		'IEMobile',								//Windows Tablet
		'(?=.*\bWindows\b)(?=.*\bARM\b)',		//Windows Phone
		'BlackBerry',							//BlackBerry
		'PlayBook',								//BlackBerry Tablet
		'Opera Mobi',							//Opera Mobile
		'Opera Mini',							//Opera Mini
		'Kindle|Silk',							//Kindle or Kindle Fire HD and HDX
		'(?=.*\bFirefox\b)(?=.*\bMobile\b)',	//Firefox AND Mobile
		'Mobile|Tablet'							//Mobile or Tablet(Firefox OS)
	],
	LANDSCAPE = 'landscape',
	PORTRAIT = 'portrait',
	NON_MOBILE = 'Non-Mobile';
	
	/**
	 * Constructor for vgDevice.Device
	 */
	vgDevice.Device = function (userAgent)
	{
		var device = this;

		this.userAgent = userAgent || navigator.userAgent;
		this.isMobile = this.isMobileDevice();

		// Initialize orientation properties for device.
		this.orientation = { changeCount : 0, type : NON_MOBILE };

		// Update orientation data and throw a custom event if necessary.
		// setTimeout is used to ensure that screen or window dimensions are updated
		// accordingly.  The screen dimensions are updated on the browser resize event.
		this.listener = function(event) {
			setTimeout(function () {
				device.orientationChange(event);
			}, 300);
		};

		/**
		 * We only apply the orientation/resize event listener on mobile
		 * devices.  If viewed on a desktop computer, the resize event would be
		 * executed too frequently and cause performance issues. 
		 * 
		 * 11/24/2014 - Add feature check for addEventListener for TIDE applications being
		 * detected as Mobile devices.  Their user agent string contains the word 
		 * "Tablet" which is used as a generic fallback for mobile or tablet devices. TIDE
		 * uses IE7 and IE8, which do not support addEventListener.
		 */
		if(this.isMobile && window.addEventListener)
		{
			//supportsOrientationChange = typeof window.onorientationchange !== 'undefined';
            this.supportsOrientationChange = window.onorientationchange ? true : false;
			this.orientationEvent = this.supportsOrientationChange ? 'orientationchange' : 'resize';
			
			//Only get orientation when device is mobile
			this.orientation.type = this.getOrientation();

			window.addEventListener(this.orientationEvent, this.listener);
		}
	};
	
	/**
	 * vgDevice.Device prototype
	 */
	vgDevice.Device.prototype =
	{
        /**
         * Returns the height of the current inner height of the window
         * @returns height
         */
        getHeight: function()
        {
            return window.innerHeight;
        },

        /**
         * Returns the height of the current inner width of the window
         * @returns width
         */
        getWidth: function()
        {
            return window.innerWidth;
        },

		/**
		 * Update the orientation properties.
		 * type = landscape or portrait
		 * changeCount = how many times the orientation has changed
		 *
		 * @param e event
		 */
		orientationChange : function (e)
		{	
			var info = this.orientation, 
				height = this.getHeight(),
				width =  this.getWidth(),
				landscape = info.type === LANDSCAPE,
				newEvent;
			
			/**
			 * if previouisly in landscape and width is now less than height
			 * or
			 * if previouisly in portrait and width is now greater than height
			 */
			if((landscape && width < height) || (!landscape && width > height))
			{
				info.type = this.getOrientation();
				info.changeCount++;
			
				//Create new custom event
				newEvent = new vgDevice.CustomEvent('vgDeviceOrientationChange', {
					bubbles: false,
					cancelable: false,
					detail: 
					{
						type: info.type, //landscape or portrait
						count: info.changeCount, //# of times orientation has changed
						height: height, //screen height
						width: width //screen width
					}
				});
				window.dispatchEvent(newEvent);
			}			
		},

		/**
		 * Returns the current device is a tablet or phone.
		 * Compares User Agent string to mobile device User Agent
		 * Regex Array.
		 *
		 * @return true or false
		 */
		isMobileDevice :  function () 
		{
			var index = mobileUA.length,
				mobile = false,
				regex;
				
			while(index--)
			{
				regex = new RegExp(mobileUA[index], 'i');
				mobile = regex.test(this.userAgent);
				if(mobile)
				{
					break; 
				}
			}
			return mobile;
		},
		
		/**
		 * Returns the current orientation of the device.
		 * @return portrait or landscape
		 */
		getOrientation : function ()
		{
			var orientation = PORTRAIT;

			/** 
			 * The window.orientation is returned differently depending
			 * on the device. On most devices, window.orientation will be
			 * 0 when in 'portrait' and 90 or -90 for landscape.  This 
			 * is not true for all devices, so we can not make the assumption 
			 * that 0 is always 'portrait'.  Therefore, we check if the window width is 
			 * greater than the height.  If so, we return 'landscape', else 'portrait'. 
			 */ 
			if(this.getHeight() < this.getWidth())
			{
				orientation = LANDSCAPE;
			}
			return orientation;
		},

		/**
		 * Deactivate resize or orientation change event listener
		 */
		unregister : function() {
			if(this.isMobile && window.removeEventListener) {
				window.removeEventListener(this.orientationEvent, this.listener);
			}
		}
	};	
}(window));
//var visitor = new Visitor("vanguard")
//visitor.trackingServer = "vanguard.d2.sc.omtrdc.net"

/*
 ============== DO NOT ALTER ANYTHING BELOW THIS LINE ! ============

 Adobe Visitor API for JavaScript version: 1.1
 Copyright 1996-2013 Adobe, Inc. All Rights Reserved
 More info available at http://www.omniture.com
 */
function Visitor(k){var a=this;a.version="1.1";var f=window;f.s_c_in||(f.s_c_il=[],f.s_c_in=0);a._c="Visitor";a._il=f.s_c_il;a._in=f.s_c_in;a._il[a._in]=a;f.s_c_in++;var i=f.document,h=f.z;h||(h=null);var j=f.A;j||(j=!0);var l=f.w;l||(l=!1);a.s=function(){var a;!a&&f.location&&(a=f.location.hostname);if(a)if(/^[0-9.]+$/.test(a))a="";else{var d=a.split("."),b=d.length-1,e=b-1;1<b&&2>=d[b].length&&0>",am,aq,ax,cc,cf,cg,ch,cv,cz,de,dj,dk,eu,fm,fo,ga,gd,gf,gl,gm,gq,gs,gw,hm,li,lu,md,mh,mp,mq,ms,ne,nl,nu,pm,si,sk,sm,sr,su,tc,td,tf,tg,tk,tv,va,vg,vu,wf,yt,".indexOf(","+
    d[b]+",")&&e--;if(0<e)for(a="";b>=e;)a=d[b]+(a?".":"")+a,b--}return a};a.cookieRead=function(a){var d=(";"+i.cookie).split(" ").join(";"),b=d.indexOf(";"+a+"="),e=0>b?b:d.indexOf(";",b+1);return 0>b?"":decodeURIComponent(d.substring(b+2+a.length,0>e?d.length:e))};a.cookieWrite=function(c,d,b){var e=a.cookieLifetime,g,d=""+d,e=e?(""+e).toUpperCase():"";b&&"SESSION"!=e&&"NONE"!=e?(g=""!=d?parseInt(e?e:0):-60)?(b=new Date,b.setTime(b.getTime()+1E3*g)):1==b&&(b=new Date,g=b.getYear(),b.setYear(g+2+(1900>
    g?1900:0))):b=0;return c&&"NONE"!=e?(i.cookie=c+"="+encodeURIComponent(d)+"; path=/;"+(b?" expires="+b.toGMTString()+";":"")+(a.k?" domain="+a.k+";":""),a.cookieRead(c)==d):0};a.b=h;a.j=function(a,d){try{"function"==typeof a?a.apply(f,d):a[1].apply(a[0],d)}catch(b){}};a.u=function(c,d){d&&(a.b==h&&(a.b={}),void 0==a.b[c]&&(a.b[c]=[]),a.b[c].push(d))};a.p=function(c,d){if(a.b!=h){var b=a.b[c];if(b)for(;0<b.length;)a.j(b.shift(),d)}};a.c=h;a.t=function(c,d,b){!d&&b&&b();var e=i.getElementsByTagName("HEAD")[0],
    g=i.createElement("SCRIPT");g.type="text/javascript";g.setAttribute("async","async");g.src=d;e.firstChild?e.insertBefore(g,e.firstChild):e.appendChild(g);a.c==h&&(a.c={});a.c[c]=setTimeout(b,a.loadTimeout)};a.q=function(c){a.c!=h&&a.c[c]&&(clearTimeout(a.c[c]),a.c[c]=0)};a.l=l;a.m=l;a.isAllowed=function(){if(!a.l&&(a.l=j,a.cookieRead(a.cookieName)||a.cookieWrite(a.cookieName,"T",1)))a.m=j;return a.m};a.a=h;a.n=l;a.i=function(){if(!a.n){a.n=j;var c=a.cookieRead(a.cookieName),d,b,e,g,f=new Date;if(c&&
    "T"!=c){c=c.split("|");1==c.length%2&&c.pop();for(d=0;d<c.length;d+=2)if(b=c[d].split("-"),e=b[0],g=c[d+1],b=1<b.length?parseInt(b[1]):0,e&&g&&(!b||f.getTime()<1E3*b))a.f(e,g,1),0<b&&(a.a["expire"+e]=b)}if(!a.d("MCAID")&&(c=a.cookieRead("s_vi")))c=c.split("|"),1<c.length&&0<=c[0].indexOf("v1")&&(g=c[1],d=g.indexOf("["),0<=d&&(g=g.substring(0,d)),g&&g.match(/^[0-9a-fA-F\-]+$/)&&a.f("MCAID",g))}};a.v=function(){var c="",d,b;for(d in a.a)!Object.prototype[d]&&a.a[d]&&"expire"!=d.substring(0,6)&&(b=a.a[d],
    c+=(c?"|":"")+d+(a.a["expire"+d]?"-"+a.a["expire"+d]:"")+"|"+b);a.cookieWrite(a.cookieName,c,1)};a.d=function(c){return a.a!=h?a.a[c]:h};a.f=function(c,d,b){a.a==h&&(a.a={});a.a[c]=d;b||a.v()};a.o=function(c,d){var b=new Date;b.setTime(b.getTime()+1E3*d);a.a==h&&(a.a={});a.a["expire"+c]=Math.floor(b.getTime()/1E3)};a.r=function(a){if(a&&("object"==typeof a&&(a=a.visitorID?a.visitorID:a.id?a.id:a.uuid?a.uuid:""+a),a&&(a=a.toUpperCase(),"NOTARGET"==a&&(a="NONE")),!a||"NONE"!=a&&!a.match(/^[0-9a-fA-F\-]+$/)))a=
    "";return a};a.g=function(c,d){var b;a.q(c);b=a.d(c);b||(b=a.r(d))&&a.f(c,b);if("object"==typeof d){var e=86400;"MCAAMID"==c&&(void 0!=d.id_sync_ttl&&d.id_sync_ttl&&(e=parseInt(d.id_sync_ttl)),a.o(c,e),a.o("MCAAMLH",e),d.dcs_region&&a.f("MCAAMLH",d.dcs_region))}a.p(c,["NONE"!=b?b:""])};a.e=h;a.h=function(c,d,b){if(a.isAllowed()){a.i();var e=a.d(c);if(e)return"NONE"==e&&a.j(b,[""]),"NONE"!=e?e:"";if(a.e==h||void 0==a.e[c])a.e==h&&(a.e={}),a.e[c]=j,a.t(c,d,function(){if(!a.d(c)){var b="";if("MCMID"==
    c){var d=b="",e,f,h=10,i=10;for(e=0;19>e;e++)f=Math.floor(Math.random()*h),b+="0123456789".substring(f,f+1),h=0==e&&9==f?3:10,f=Math.floor(Math.random()*i),d+="0123456789".substring(f,f+1),i=0==e&&9==f?3:10;b+=d}a.g(c,b)}});a.u(c,b)}return""};a.setMarketingCloudVisitorID=function(c){a.g("MCMID",c)};a.getMarketingCloudVisitorID=function(c){var d=a.marketingCloudServer,b="";a.loadSSL&&a.marketingCloudServerSecure&&(d=a.marketingCloudServerSecure);d&&(b="http"+(a.loadSSL?"s":"")+"://"+d+"/id?d_rtbd=json&d_cid="+
    encodeURIComponent(a.namespace)+"&d_cb=s_c_il%5B"+a._in+"%5D.setMarketingCloudVisitorID");return a.h("MCMID",b,c)};a.setAudienceManagerVisitorID=function(c){a.g("MCAAMID",c)};a.getAudienceManagerVisitorID=function(c){var d=a.audienceManagerServer,b="";a.loadSSL&&a.audienceManagerServerSecure&&(d=a.audienceManagerServerSecure);d&&(b="http"+(a.loadSSL?"s":"")+"://"+d+"/id?d_rtbd=json&d_cb=s_c_il%5B"+a._in+"%5D.setAudienceManagerVisitorID");return a.h("MCAAMID",b,c)};a.getAudienceManagerLocationHint=
    function(){a.i();var c=a.d("MCAAMLH");return c?c:0};a.setAnalyticsVisitorID=function(c){a.i();a.g("MCAID",c)};a.getAnalyticsVisitorID=function(c){var d=a.trackingServer,b="";a.loadSSL&&a.trackingServerSecure&&(d=a.trackingServerSecure);d&&(b="http"+(a.loadSSL?"s":"")+"://"+d+"/id?callback=s_c_il%5B"+a._in+"%5D.setAnalyticsVisitorID");return a.h("MCAID",b,c)};a.getVisitorID=function(c){return a.getMarketingCloudVisitorID(c)};a.namespace=k;a.cookieName="AMCV_"+k;a.k=a.s();a.loadSSL=0<=f.location.protocol.toLowerCase().indexOf("https");
    a.loadTimeout=500;a.marketingCloudServer=a.audienceManagerServer="dpm.demdex.net"}Visitor.getInstance=function(k){var a,f=window.s_c_il,i;if(f)for(i=0;i<f.length;i++)if((a=f[i])&&"Visitor"==a._c&&a.namespace==k)return a;return new Visitor(k)};
/*
 ============================= MODULES ===========================
 */

/*
 *	Integrate Module
 */
function AppMeasurement_Module_Integrate(s){var m=this;m.s=s;var w=window;if(!w.s_c_in)w.s_c_il=[],w.s_c_in=0;m._il=w.s_c_il;m._in=w.s_c_in;m._il[m._in]=m;w.s_c_in++;m._c="s_m";m.list=[];m.add=function(c,b){var a;b||(b="s_Integrate_"+c);w[b]||(w[b]={});a=m[c]=w[b];a.a=c;a.e=m;a._c=0;a._d=0;a.disable==void 0&&(a.disable=0);a.get=function(b,c){var d=document,f=d.getElementsByTagName("HEAD"),g;if(!a.disable&&(c||(v="s_"+m._in+"_Integrate_"+a.a+"_get_"+a._c),a._c++,a.VAR=v,a.CALLBACK="s_c_il["+m._in+
        "]."+a.a+".callback",a.delay(),f=f&&f.length>0?f[0]:d.body))try{g=d.createElement("SCRIPT");g.type="text/javascript";g.setAttribute("async","async");g.src=m.c(a,b);if(b.indexOf("[CALLBACK]")<0)g.onload=g.onreadystatechange=function(){if(w[v]){a.callback(w[v])}};f.firstChild?f.insertBefore(g,f.firstChild):f.appendChild(g)}catch(s){}};a.callback=function(b){var m;if(b)for(m in b)Object.prototype[m]||(a[m]=b[m]);a.ready()};a.beacon=function(b){var c="s_i_"+m._in+"_Integrate_"+a.a+"_"+a._c;if(!a.disable)a._c++,
    c=w[c]=new Image,c.src=m.c(a,b)};a.script=function(b){a.get(b,1)};a.delay=function(){a._d++};a.ready=function(){a._d--;a.disable||s.delayReady()};m.list.push(c)};m._g=function(c){var b,a=(c?"use":"set")+"Vars";for(c=0;c<m.list.length;c++)if((b=m[m.list[c]])&&!b.disable&&b[a])try{b[a](s,b)}catch(w){}};m._t=function(){m._g(1)};m._d=function(){var c,b;for(c=0;c<m.list.length;c++)if((b=m[m.list[c]])&&!b.disable&&b._d>0)return 1;return 0};m.c=function(m,b){var a,w,e,d;b.toLowerCase().substring(0,4)!="http"&&
(b="http://"+b);s.ssl&&(b=s.replace(b,"http:","https:"));m.RAND=Math.floor(Math.random()*1E13);for(a=0;a>=0;)a=b.indexOf("[",a),a>=0&&(w=b.indexOf("]",a),w>a&&(e=b.substring(a+1,w),e.length>2&&e.substring(0,2)=="s."?(d=s[e.substring(2)])||(d=""):(d=""+m[e],d!=m[e]&&parseFloat(d)!=m[e]&&(e=0)),e&&(b=b.substring(0,a)+encodeURIComponent(d)+b.substring(w+1)),a=w));return b}}

/*
 ============== DO NOT ALTER ANYTHING BELOW THIS LINE ! ===============

 AppMeasurement for JavaScript version: 1.2
 Copyright 1996-2013 Adobe, Inc. All Rights Reserved
 More info available at http://www.omniture.com
 */
function AppMeasurement(){var s=this;s.version="1.2";var w=window;if(!w.s_c_in)w.s_c_il=[],w.s_c_in=0;s._il=w.s_c_il;s._in=w.s_c_in;s._il[s._in]=s;w.s_c_in++;s._c="s_c";var k=w.fb;k||(k=null);var m=w,i,n;try{i=m.parent;for(n=m.location;i&&i.location&&n&&""+i.location!=""+n&&m.location&&""+i.location!=""+m.location&&i.location.host==n.host;)m=i,i=m.parent}catch(p){}s.Sa=function(s){try{console.log(s)}catch(a){}};s.ja=function(s){return""+parseInt(s)==""+s};s.replace=function(s,a,c){if(!s||s.indexOf(a)<
    0)return s;return s.split(a).join(c)};s.escape=function(b){var a,c;if(!b)return b;b=encodeURIComponent(b);for(a=0;a<7;a++)c="+~!*()'".substring(a,a+1),b.indexOf(c)>=0&&(b=s.replace(b,c,"%"+c.charCodeAt(0).toString(16).toUpperCase()));return b};s.unescape=function(b){if(!b)return b;b=b.indexOf("+")>=0?s.replace(b,"+"," "):b;try{return decodeURIComponent(b)}catch(a){}return unescape(b)};s.Ja=function(){var b=w.location.hostname,a=s.fpCookieDomainPeriods,c;if(!a)a=s.cookieDomainPeriods;if(b&&!s.ca&&
    !/^[0-9.]+$/.test(b)&&(a=a?parseInt(a):2,a=a>2?a:2,c=b.lastIndexOf("."),c>=0)){for(;c>=0&&a>1;)c=b.lastIndexOf(".",c-1),a--;s.ca=c>0?b.substring(c):b}return s.ca};s.c_r=s.cookieRead=function(b){b=s.escape(b);var a=" "+s.d.cookie,c=a.indexOf(" "+b+"="),e=c<0?c:a.indexOf(";",c);b=c<0?"":s.unescape(a.substring(c+2+b.length,e<0?a.length:e));return b!="[[B]]"?b:""};s.c_w=s.cookieWrite=function(b,a,c){var e=s.Ja(),d=s.cookieLifetime,f;a=""+a;d=d?(""+d).toUpperCase():"";c&&d!="SESSION"&&d!="NONE"&&((f=a!=
""?parseInt(d?d:0):-60)?(c=new Date,c.setTime(c.getTime()+f*1E3)):c==1&&(c=new Date,f=c.getYear(),c.setYear(f+5+(f<1900?1900:0))));if(b&&d!="NONE")return s.d.cookie=b+"="+s.escape(a!=""?a:"[[B]]")+"; path=/;"+(c&&d!="SESSION"?" expires="+c.toGMTString()+";":"")+(e?" domain="+e+";":""),s.cookieRead(b)==a;return 0};s.C=[];s.B=function(b,a,c){if(s.da)return 0;if(!s.maxDelay)s.maxDelay=250;var e=0,d=(new Date).getTime()+s.maxDelay,f=s.d.cb,g=["webkitvisibilitychange","visibilitychange"];if(!f)f=s.d.eb;
    if(f&&f=="prerender"){if(!s.M){s.M=1;for(c=0;c<g.length;c++)s.d.addEventListener(g[c],function(){var b=s.d.cb;if(!b)b=s.d.eb;if(b=="visible")s.M=0,s.delayReady()})}e=1;d=0}else c||s.q("_d")&&(e=1);e&&(s.C.push({m:b,a:a,t:d}),s.M||setTimeout(s.delayReady,s.maxDelay));return e};s.delayReady=function(){var b=(new Date).getTime(),a=0,c;for(s.q("_d")&&(a=1);s.C.length>0;){c=s.C.shift();if(a&&!c.t&&c.t>b){s.C.unshift(c);setTimeout(s.delayReady,parseInt(s.maxDelay/2));break}s.da=1;s[c.m].apply(s,c.a);s.da=
    0}};s.setAccount=s.sa=function(b){var a,c;if(!s.B("setAccount",arguments))if(s.account=b,s.allAccounts){a=s.allAccounts.concat(b.split(","));s.allAccounts=[];a.sort();for(c=0;c<a.length;c++)(c==0||a[c-1]!=a[c])&&s.allAccounts.push(a[c])}else s.allAccounts=b.split(",")};s.W=function(b,a,c,e,d){var f="",g,j,w,q,i=0;b=="contextData"&&(b="c");if(a){for(g in a)if(!Object.prototype[g]&&(!d||g.substring(0,d.length)==d)&&a[g]&&(!c||c.indexOf(","+(e?e+".":"")+g+",")>=0)){w=!1;if(i)for(j=0;j<i.length;j++)g.substring(0,
    i[j].length)==i[j]&&(w=!0);if(!w&&(f==""&&(f+="&"+b+"."),j=a[g],d&&(g=g.substring(d.length)),g.length>0))if(w=g.indexOf("."),w>0)j=g.substring(0,w),w=(d?d:"")+j+".",i||(i=[]),i.push(w),f+=s.W(j,a,c,e,w);else if(typeof j=="boolean"&&(j=j?"true":"false"),j){if(e=="retrieveLightData"&&d.indexOf(".contextData.")<0)switch(w=g.substring(0,4),q=g.substring(4),g){case "transactionID":g="xact";break;case "channel":g="ch";break;case "campaign":g="v0";break;default:s.ja(q)&&(w=="prop"?g="c"+q:w=="eVar"?g="v"+
    q:w=="list"?g="l"+q:w=="hier"&&(g="h"+q,j=j.substring(0,255)))}f+="&"+s.escape(g)+"="+s.escape(j)}}f!=""&&(f+="&."+b)}return f};s.La=function(){var b="",a,c,e,d,f,g,j,w,i="",k="",m=c="";if(s.lightProfileID)a=s.P,(i=s.lightTrackVars)&&(i=","+i+","+s.ma.join(",")+",");else{a=s.e;if(s.pe||s.linkType)if(i=s.linkTrackVars,k=s.linkTrackEvents,s.pe&&(c=s.pe.substring(0,1).toUpperCase()+s.pe.substring(1),s[c]))i=s[c].pb,k=s[c].ob;i&&(i=","+i+","+s.H.join(",")+",");k&&(k=","+k+",",i&&(i+=",events,"));s.events2&&
(m+=(m!=""?",":"")+s.events2)}for(c=0;c<a.length;c++){d=a[c];f=s[d];e=d.substring(0,4);g=d.substring(4);!f&&d=="events"&&m&&(f=m,m="");if(f&&(!i||i.indexOf(","+d+",")>=0)){switch(d){case "timestamp":d="ts";break;case "dynamicVariablePrefix":d="D";break;case "visitorID":d="vid";break;case "marketingCloudVisitorID":d="mid";break;case "analyticsVisitorID":d="aid";break;case "audienceManagerVisitorID":d="aamid";break;case "audienceManagerLocationHint":d="aamlh";break;case "pageURL":d="g";if(f.length>
    255)s.pageURLRest=f.substring(255),f=f.substring(0,255);break;case "pageURLRest":d="-g";break;case "referrer":d="r";break;case "vmk":case "visitorMigrationKey":d="vmt";break;case "visitorMigrationServer":d="vmf";s.ssl&&s.visitorMigrationServerSecure&&(f="");break;case "visitorMigrationServerSecure":d="vmf";!s.ssl&&s.visitorMigrationServer&&(f="");break;case "charSet":d="ce";break;case "visitorNamespace":d="ns";break;case "cookieDomainPeriods":d="cdp";break;case "cookieLifetime":d="cl";break;case "variableProvider":d=
    "vvp";break;case "currencyCode":d="cc";break;case "channel":d="ch";break;case "transactionID":d="xact";break;case "campaign":d="v0";break;case "resolution":d="s";break;case "colorDepth":d="c";break;case "javascriptVersion":d="j";break;case "javaEnabled":d="v";break;case "cookiesEnabled":d="k";break;case "browserWidth":d="bw";break;case "browserHeight":d="bh";break;case "connectionType":d="ct";break;case "homepage":d="hp";break;case "plugins":d="p";break;case "events":m&&(f+=(f!=""?",":"")+m);if(k){g=
    f.split(",");f="";for(e=0;e<g.length;e++)j=g[e],w=j.indexOf("="),w>=0&&(j=j.substring(0,w)),w=j.indexOf(":"),w>=0&&(j=j.substring(0,w)),k.indexOf(","+j+",")>=0&&(f+=(f?",":"")+g[e])}break;case "events2":f="";break;case "contextData":b+=s.W("c",s[d],i,d);f="";break;case "lightProfileID":d="mtp";break;case "lightStoreForSeconds":d="mtss";s.lightProfileID||(f="");break;case "lightIncrementBy":d="mti";s.lightProfileID||(f="");break;case "retrieveLightProfiles":d="mtsr";break;case "deleteLightProfiles":d=
    "mtsd";break;case "retrieveLightData":s.retrieveLightProfiles&&(b+=s.W("mts",s[d],i,d));f="";break;default:s.ja(g)&&(e=="prop"?d="c"+g:e=="eVar"?d="v"+g:e=="list"?d="l"+g:e=="hier"&&(d="h"+g,f=f.substring(0,255)))}f&&(b+="&"+d+"="+(d.substring(0,3)!="pev"?s.escape(f):f))}d=="pev3"&&s.g&&(b+=s.g)}return b};s.u=function(s){var a=s.tagName;if(""+s.nb!="undefined"||""+s.Xa!="undefined"&&(""+s.Xa).toUpperCase()!="HTML")return"";a=a&&a.toUpperCase?a.toUpperCase():"";a=="SHAPE"&&(a="");a&&((a=="INPUT"||
a=="BUTTON")&&s.type&&s.type.toUpperCase?a=s.type.toUpperCase():!a&&s.href&&(a="A"));return a};s.fa=function(s){var a=s.href?s.href:"",c,e,d;c=a.indexOf(":");e=a.indexOf("?");d=a.indexOf("/");if(a&&(c<0||e>=0&&c>e||d>=0&&c>d))e=s.protocol&&s.protocol.length>1?s.protocol:l.protocol?l.protocol:"",c=l.pathname.lastIndexOf("/"),a=(e?e+"//":"")+(s.host?s.host:l.host?l.host:"")+(h.substring(0,1)!="/"?l.pathname.substring(0,c<0?0:c)+"/":"")+a;return a};s.D=function(b){var a=s.u(b),c,e,d="",f=0;if(a){c=b.protocol;
    e=b.onclick;if(b.href&&(a=="A"||a=="AREA")&&(!e||!c||c.toLowerCase().indexOf("javascript")<0))d=s.fa(b);else if(e)d=s.replace(s.replace(s.replace(s.replace(""+e,"\r",""),"\n",""),"\t","")," ",""),f=2;else if(a=="INPUT"||a=="SUBMIT"){if(b.value)d=b.value;else if(b.innerText)d=b.innerText;else if(b.textContent)d=b.textContent;f=3}else if(b.src&&a=="IMAGE")d=b.src;if(d)return{id:d.substring(0,100),type:f}}return 0};s.kb=function(b){for(var a=s.u(b),c=s.D(b);b&&!c&&a!="BODY";)if(b=b.parentElement?b.parentElement:
        b.parentNode)a=s.u(b),c=s.D(b);if(!c||a=="BODY")b=0;if(b&&(a=b.onclick?""+b.onclick:"",a.indexOf(".tl(")>=0||a.indexOf(".trackLink(")>=0))b=0;return b};s.Va=function(){var b,a,c=s.linkObject,e=s.linkType,d=s.linkURL,f,g;s.Q=1;if(!c)s.Q=0,c=s.j;if(c){b=s.u(c);for(a=s.D(c);c&&!a&&b!="BODY";)if(c=c.parentElement?c.parentElement:c.parentNode)b=s.u(c),a=s.D(c);if(!a||b=="BODY")c=0;if(c){var j=c.onclick?""+c.onclick:"";if(j.indexOf(".tl(")>=0||j.indexOf(".trackLink(")>=0)c=0}}else s.Q=1;!d&&c&&(d=s.fa(c));
    d&&!s.linkLeaveQueryString&&(f=d.indexOf("?"),f>=0&&(d=d.substring(0,f)));if(!e&&d){var i=0,k=0,m;if(s.trackDownloadLinks&&s.linkDownloadFileTypes){j=d.toLowerCase();f=j.indexOf("?");g=j.indexOf("#");f>=0?g>=0&&g<f&&(f=g):f=g;f>=0&&(j=j.substring(0,f));f=s.linkDownloadFileTypes.toLowerCase().split(",");for(g=0;g<f.length;g++)(m=f[g])&&j.substring(j.length-(m.length+1))=="."+m&&(e="d")}if(s.trackExternalLinks&&!e&&(j=d.toLowerCase(),s.ia(j))){if(!s.linkInternalFilters)s.linkInternalFilters=w.location.hostname;
        f=0;s.linkExternalFilters?(f=s.linkExternalFilters.toLowerCase().split(","),i=1):s.linkInternalFilters&&(f=s.linkInternalFilters.toLowerCase().split(","));if(f){for(g=0;g<f.length;g++)m=f[g],j.indexOf(m)>=0&&(k=1);k?i&&(e="e"):i||(e="e")}}}s.linkObject=c;s.linkURL=d;s.linkType=e;if(s.trackClickMap||s.trackInlineStats)if(s.g="",c){e=s.pageName;d=1;c=c.sourceIndex;if(!e)e=s.pageURL,d=0;if(w.s_objectID)a.id=w.s_objectID,c=a.type=1;if(e&&a&&a.id&&b)s.g="&pid="+s.escape(e.substring(0,255))+(d?"&pidt="+
        d:"")+"&oid="+s.escape(a.id.substring(0,100))+(a.type?"&oidt="+a.type:"")+"&ot="+b+(c?"&oi="+c:"")}};s.Ma=function(){var b=s.Q,a=s.linkType,c=s.linkURL,e=s.linkName;if(a&&(c||e))a=a.toLowerCase(),a!="d"&&a!="e"&&(a="o"),s.pe="lnk_"+a,s.pev1=c?s.escape(c):"",s.pev2=e?s.escape(e):"",b=1;s.abort&&(b=0);if(s.trackClickMap||s.trackInlineStats){a={};c=0;var d=s.cookieRead("s_sq"),f=d?d.split("&"):0,g,j,w;d=0;if(f)for(g=0;g<f.length;g++)j=f[g].split("="),e=s.unescape(j[0]).split(","),j=s.unescape(j[1]),
    a[j]=e;e=s.account.split(",");if(b||s.g){b&&!s.g&&(d=1);for(j in a)if(!Object.prototype[j])for(g=0;g<e.length;g++){d&&(w=a[j].join(","),w==s.account&&(s.g+=(j.charAt(0)!="&"?"&":"")+j,a[j]=[],c=1));for(f=0;f<a[j].length;f++)w=a[j][f],w==e[g]&&(d&&(s.g+="&u="+s.escape(w)+(j.charAt(0)!="&"?"&":"")+j+"&u=0"),a[j].splice(f,1),c=1)}b||(c=1);if(c){d="";g=2;!b&&s.g&&(d=s.escape(e.join(","))+"="+s.escape(s.g),g=1);for(j in a)!Object.prototype[j]&&g>0&&a[j].length>0&&(d+=(d?"&":"")+s.escape(a[j].join(","))+
    "="+s.escape(j),g--);s.cookieWrite("s_sq",d)}}}return b};s.Na=function(){if(!s.bb){var b=new Date,a=m.location,c,e,d,f=d=e=c="",g="",w="",i="1.2",k=s.cookieWrite("s_cc","true",0)?"Y":"N",n="",p="",o=0;if(b.setUTCDate&&(i="1.3",o.toPrecision&&(i="1.5",c=[],c.forEach))){i="1.6";d=0;e={};try{d=new Iterator(e),d.next&&(i="1.7",c.reduce&&(i="1.8",i.trim&&(i="1.8.1",Date.parse&&(i="1.8.2",Object.create&&(i="1.8.5")))))}catch(r){}}c=screen.width+"x"+screen.height;d=navigator.javaEnabled()?"Y":"N";e=screen.pixelDepth?
    screen.pixelDepth:screen.colorDepth;g=s.w.innerWidth?s.w.innerWidth:s.d.documentElement.offsetWidth;w=s.w.innerHeight?s.w.innerHeight:s.d.documentElement.offsetHeight;b=navigator.plugins;try{s.b.addBehavior("#default#homePage"),n=s.b.lb(a)?"Y":"N"}catch(t){}try{s.b.addBehavior("#default#clientCaps"),p=s.b.connectionType}catch(u){}if(b)for(;o<b.length&&o<30;){if(a=b[o].name)a=a.substring(0,100)+";",f.indexOf(a)<0&&(f+=a);o++}s.resolution=c;s.colorDepth=e;s.javascriptVersion=i;s.javaEnabled=d;s.cookiesEnabled=
    k;s.browserWidth=g;s.browserHeight=w;s.connectionType=p;s.homepage=n;s.plugins=f;s.bb=1}};s.G={};s.loadModule=function(b,a){var c=s.G[b];if(!c){c=w["AppMeasurement_Module_"+b]?new w["AppMeasurement_Module_"+b](s):{};s.G[b]=s[b]=c;c.ua=function(){return c.wa};c.xa=function(a){if(c.wa=a)s[b+"_onLoad"]=a,s.B(b+"_onLoad",[s,c],1)||a(s,c)};try{Object.defineProperty?Object.defineProperty(c,"onLoad",{get:c.ua,set:c.xa}):c._olc=1}catch(e){c._olc=1}}a&&(s[b+"_onLoad"]=a,s.B(b+"_onLoad",[s,c],1)||a(s,c))};
    s.q=function(b){var a,c;for(a in s.G)if(!Object.prototype[a]&&(c=s.G[a])){if(c._olc&&c.onLoad)c._olc=0,c.onLoad(s,c);if(c[b]&&c[b]())return 1}return 0};s.Qa=function(){var b=Math.floor(Math.random()*1E13),a=s.visitorSampling,c=s.visitorSamplingGroup;c="s_vsn_"+(s.visitorNamespace?s.visitorNamespace:s.account)+(c?"_"+c:"");var e=s.cookieRead(c);if(a){e&&(e=parseInt(e));if(!e){if(!s.cookieWrite(c,b))return 0;e=b}if(e%1E4>v)return 0}return 1};s.I=function(b,a){var c,e,d,f,g,w;for(c=0;c<2;c++){e=c>0?
        s.$:s.e;for(d=0;d<e.length;d++)if(f=e[d],(g=b[f])||b["!"+f]){if(!a&&(f=="contextData"||f=="retrieveLightData")&&s[f])for(w in s[f])g[w]||(g[w]=s[f][w]);s[f]=g}}};s.qa=function(b,a){var c,e,d,f;for(c=0;c<2;c++){e=c>0?s.$:s.e;for(d=0;d<e.length;d++)f=e[d],b[f]=s[f],!a&&!b[f]&&(b["!"+f]=1)}};s.Ia=function(s){var a,c,e,d,f,g=0,w,i="",k="";if(s&&s.length>255&&(a=""+s,c=a.indexOf("?"),c>0&&(w=a.substring(c+1),a=a.substring(0,c),d=a.toLowerCase(),e=0,d.substring(0,7)=="http://"?e+=7:d.substring(0,8)=="https://"&&
        (e+=8),c=d.indexOf("/",e),c>0&&(d=d.substring(e,c),f=a.substring(c),a=a.substring(0,c),d.indexOf("google")>=0?g=",q,ie,start,search_key,word,kw,cd,":d.indexOf("yahoo.co")>=0&&(g=",p,ei,"),g&&w)))){if((s=w.split("&"))&&s.length>1){for(e=0;e<s.length;e++)d=s[e],c=d.indexOf("="),c>0&&g.indexOf(","+d.substring(0,c)+",")>=0?i+=(i?"&":"")+d:k+=(k?"&":"")+d;i&&k?w=i+"&"+k:k=""}c=253-(w.length-k.length)-a.length;s=a+(c>0?f.substring(0,c):"")+"?"+w}return s};s.za=!1;s.Z=!1;s.ib=function(b){s.marketingCloudVisitorID=
        b;s.Z=!0;s.z()};s.J=!1;s.X=!1;s.ta=function(b){s.analyticsVisitorID=b;s.X=!0;s.z()};s.ya=!1;s.Y=!1;s.hb=function(b){s.audienceManagerVisitorID=b;if(s.audienceManagerVisitorID&&s.visitor.getAudienceManagerLocationHint)s.audienceManagerLocationHint=s.visitor.getAudienceManagerLocationHint();s.Y=!0;s.z()};s.isReadyToTrack=function(){var b=!0,a=s.visitor;if(a&&a.isAllowed()){if(!s.J&&!s.analyticsVisitorID&&a.getAnalyticsVisitorID&&(s.analyticsVisitorID=a.getAnalyticsVisitorID([s,s.ta]),!s.analyticsVisitorID))s.J=
        !0;if(s.za&&!s.Z&&!s.marketingCloudVisitorID||s.J&&!s.X&&!s.analyticsVisitorID||s.ya&&!s.Y&&!s.audienceManagerVisitorID)b=!1}return b};s.k=k;s.l=0;s.callbackWhenReadyToTrack=function(b,a,c){var e;e={};e.Da=b;e.Ca=a;e.Aa=c;if(s.k==k)s.k=[];s.k.push(e);if(s.l==0)s.l=setInterval(s.z,100)};s.z=function(){var b;if(s.isReadyToTrack()){if(s.l)clearInterval(s.l),s.l=0;if(s.k!=k)for(;s.k.length>0;)b=s.k.shift(),b.Ca.apply(b.Da,b.Aa)}};s.va=function(b){var a,c,e=k,d=k;if(!s.isReadyToTrack()){a=[];if(b!=k)for(c in e=
    {},b)e[c]=b[c];d={};s.qa(d,!0);a.push(e);a.push(d);s.callbackWhenReadyToTrack(s,s.track,a);return!0}return!1};s.Ka=function(){var b=s.cookieRead("s_fid"),a="",c="",e;e=8;var d=4;if(!b||b.indexOf("-")<0){for(b=0;b<16;b++)e=Math.floor(Math.random()*e),a+="0123456789ABCDEF".substring(e,e+1),e=Math.floor(Math.random()*d),c+="0123456789ABCDEF".substring(e,e+1),e=d=16;b=a+"-"+c}s.cookieWrite("s_fid",b,1)||(b=0);return b};s.t=s.track=function(b,a){var c,e=new Date,d="s"+Math.floor(e.getTime()/108E5)%10+
        Math.floor(Math.random()*1E13),f=e.getYear();f="t="+s.escape(e.getDate()+"/"+e.getMonth()+"/"+(f<1900?f+1900:f)+" "+e.getHours()+":"+e.getMinutes()+":"+e.getSeconds()+" "+e.getDay()+" "+e.getTimezoneOffset());s.q("_s");if(!s.B("track",arguments)){if(!s.va(b)){a&&s.I(a);b&&(c={},s.qa(c,0),s.I(b));if(s.Qa()){if(!s.analyticsVisitorID&&!s.marketingCloudVisitorID)s.fid=s.Ka();s.Va();s.usePlugins&&s.doPlugins&&s.doPlugins(s);if(s.account){if(!s.abort){if(s.trackOffline&&!s.timestamp)s.timestamp=Math.floor(e.getTime()/
        1E3);e=w.location;if(!s.pageURL)s.pageURL=e.href?e.href:e;if(!s.referrer&&!s.ra)s.referrer=m.document.referrer,s.ra=1;s.referrer=s.Ia(s.referrer);s.q("_g")}s.Ma()&&!s.abort&&(s.Na(),f+=s.La(),s.Ua(d,f));s.abort||s.q("_t")}}b&&s.I(c,1)}s.timestamp=s.linkObject=s.j=s.linkURL=s.linkName=s.linkType=w.mb=s.pe=s.pev1=s.pev2=s.pev3=s.g=0}};s.tl=s.trackLink=function(b,a,c,e,d){s.linkObject=b;s.linkType=a;s.linkName=c;if(d)s.i=b,s.p=d;return s.track(e)};s.trackLight=function(b,a,c,e){s.lightProfileID=b;s.lightStoreForSeconds=
        a;s.lightIncrementBy=c;return s.track(e)};s.clearVars=function(){var b,a;for(b=0;b<s.e.length;b++)if(a=s.e[b],a.substring(0,4)=="prop"||a.substring(0,4)=="eVar"||a.substring(0,4)=="hier"||a.substring(0,4)=="list"||a=="channel"||a=="events"||a=="eventList"||a=="products"||a=="productList"||a=="purchaseID"||a=="transactionID"||a=="state"||a=="zip"||a=="campaign")s[a]=void 0};s.Ua=function(b,a){var c,e=s.trackingServer;c="";var d=s.dc,f="sc.",w=s.visitorNamespace;if(e){if(s.trackingServerSecure&&s.ssl)e=
        s.trackingServerSecure}else{if(!w)w=s.account,e=w.indexOf(","),e>=0&&(w=w.gb(0,e)),w=w.replace(/[^A-Za-z0-9]/g,"");c||(c="2o7.net");d=d?(""+d).toLowerCase():"d1";c=="2o7.net"&&(d=="d1"?d="112":d=="d2"&&(d="122"),f="");e=w+"."+d+"."+f+c}c=s.ssl?"https://":"http://";c+=e+"/b/ss/"+s.account+"/"+(s.mobile?"5.":"")+"1/JS-"+s.version+(s.ab?"T":"")+"/"+b+"?AQB=1&ndh=1&"+a+"&AQE=1";s.Pa&&(c=c.substring(0,2047));s.Ga(c);s.N()};s.Ga=function(b){s.c||s.Oa();s.c.push(b);s.O=s.r();s.pa()};s.Oa=function(){s.c=
        s.Ra();if(!s.c)s.c=[]};s.Ra=function(){var b,a;if(s.T()){try{(a=w.localStorage.getItem(s.R()))&&(b=w.JSON.parse(a))}catch(c){}return b}};s.T=function(){var b=!0;if(!s.trackOffline||!s.offlineFilename||!w.localStorage||!w.JSON)b=!1;return b};s.ga=function(){var b=0;if(s.c)b=s.c.length;s.v&&b++;return b};s.N=function(){if(!s.v)if(s.ha=k,s.S)s.O>s.F&&s.na(s.c),s.V(500);else{var b=s.Ba();if(b>0)s.V(b);else if(b=s.ea())s.v=1,s.Ta(b),s.Ya(b)}};s.V=function(b){if(!s.ha)b||(b=0),s.ha=setTimeout(s.N,b)};s.Ba=
        function(){var b;if(!s.trackOffline||s.offlineThrottleDelay<=0)return 0;b=s.r()-s.la;if(s.offlineThrottleDelay<b)return 0;return s.offlineThrottleDelay-b};s.ea=function(){if(s.c.length>0)return s.c.shift()};s.Ta=function(b){if(s.debugTracking){var a="AppMeasurement Debug: "+b;b=b.split("&");var c;for(c=0;c<b.length;c++)a+="\n\t"+s.unescape(b[c]);s.Sa(a)}};s.Ya=function(b){var a;if(!a)a=new Image,a.alt="";a.ba=function(){try{if(s.U)clearTimeout(s.U),s.U=0;if(a.timeout)clearTimeout(a.timeout),a.timeout=
        0}catch(b){}};a.onload=a.$a=function(){a.ba();s.Fa();s.K();s.v=0;s.N()};a.onabort=a.onerror=a.Ha=function(){a.ba();(s.trackOffline||s.S)&&s.v&&s.c.unshift(s.Ea);s.v=0;s.O>s.F&&s.na(s.c);s.K();s.V(500)};a.onreadystatechange=function(){a.readyState==4&&(a.status==200?a.$a():a.Ha())};s.la=s.r();a.src=b;if(a.abort)s.U=setTimeout(a.abort,5E3);s.Ea=b;s.jb=w["s_i_"+s.replace(s.account,",","_")]=a;if(s.useForcedLinkTracking&&s.A||s.p){if(!s.forcedLinkTrackingTimeout)s.forcedLinkTrackingTimeout=250;s.L=setTimeout(s.K,
        s.forcedLinkTrackingTimeout)}};s.Fa=function(){if(s.T()&&!(s.ka>s.F))try{w.localStorage.removeItem(s.R()),s.ka=s.r()}catch(b){}};s.na=function(b){if(s.T()){s.pa();try{w.localStorage.setItem(s.R(),w.JSON.stringify(b)),s.F=s.r()}catch(a){}}};s.pa=function(){if(s.trackOffline){if(!s.offlineLimit||s.offlineLimit<=0)s.offlineLimit=10;for(;s.c.length>s.offlineLimit;)s.ea()}};s.forceOffline=function(){s.S=!0};s.forceOnline=function(){s.S=!1};s.R=function(){return s.offlineFilename+"-"+s.visitorNamespace+
        s.account};s.r=function(){return(new Date).getTime()};s.ia=function(s){s=s.toLowerCase();if(s.indexOf("#")!=0&&s.indexOf("about:")!=0&&s.indexOf("opera:")!=0&&s.indexOf("javascript:")!=0)return!0;return!1};s.setTagContainer=function(b){var a,c,e;s.ab=b;for(a=0;a<s._il.length;a++)if((c=s._il[a])&&c._c=="s_l"&&c.tagContainerName==b){s.I(c);if(c.lmq)for(a=0;a<c.lmq.length;a++)e=c.lmq[a],s.loadModule(e.n);if(c.ml)for(e in c.ml)if(s[e])for(a in b=s[e],e=c.ml[e],e)if(!Object.prototype[a]&&(typeof e[a]!=
        "function"||(""+e[a]).indexOf("s_c_il")<0))b[a]=e[a];if(c.mmq)for(a=0;a<c.mmq.length;a++)e=c.mmq[a],s[e.m]&&(b=s[e.m],b[e.f]&&typeof b[e.f]=="function"&&(e.a?b[e.f].apply(b,e.a):b[e.f].apply(b)));if(c.tq)for(a=0;a<c.tq.length;a++)s.track(c.tq[a]);c.s=s;break}};s.Util={urlEncode:s.escape,urlDecode:s.unescape,cookieRead:s.cookieRead,cookieWrite:s.cookieWrite,getQueryParam:function(b,a,c){var e;a||(a=s.pageURL?s.pageURL:w.location);c||(c="&");if(b&&a&&(a=""+a,e=a.indexOf("?"),e>=0&&(a=c+a.substring(e+
                1)+c,e=a.indexOf(c+b+"="),e>=0&&(a=a.substring(e+c.length+b.length+1),e=a.indexOf(c),e>=0&&(a=a.substring(0,e)),a.length>0))))return s.unescape(a);return""}};s.H=["timestamp","dynamicVariablePrefix","visitorID","marketingCloudVisitorID","analyticsVisitorID","audienceManagerVisitorID","audienceManagerLocationHint","fid","vmk","visitorMigrationKey","visitorMigrationServer","visitorMigrationServerSecure","charSet","visitorNamespace","cookieDomainPeriods","fpCookieDomainPeriods","cookieLifetime","pageName",
        "pageURL","referrer","contextData","currencyCode","lightProfileID","lightStoreForSeconds","lightIncrementBy","retrieveLightProfiles","deleteLightProfiles","retrieveLightData","pe","pev1","pev2","pev3","pageURLRest"];s.e=s.H.concat(["purchaseID","variableProvider","channel","server","pageType","transactionID","campaign","state","zip","events","events2","products","tnt"]);s.ma=["timestamp","charSet","visitorNamespace","cookieDomainPeriods","cookieLifetime","contextData","lightProfileID","lightStoreForSeconds",
        "lightIncrementBy"];s.P=s.ma.slice(0);s.$=["account","allAccounts","debugTracking","visitor","trackOffline","offlineLimit","offlineThrottleDelay","offlineFilename","usePlugins","doPlugins","configURL","visitorSampling","s.visitorSamplingGroup","linkObject","linkURL","linkName","linkType","trackDownloadLinks","trackExternalLinks","trackClickMap","trackInlineStats","linkLeaveQueryString","linkTrackVars","linkTrackEvents","linkDownloadFileTypes","linkExternalFilters","linkInternalFilters","useForcedLinkTracking",
        "forcedLinkTrackingTimeout","trackingServer","trackingServerSecure","ssl","abort","mobile","dc","lightTrackVars","maxDelay"];for(i=0;i<=75;i++)s.e.push("prop"+i),s.P.push("prop"+i),s.e.push("eVar"+i),s.P.push("eVar"+i),i<6&&s.e.push("hier"+i),i<4&&s.e.push("list"+i);i=["resolution","colorDepth","javascriptVersion","javaEnabled","cookiesEnabled","browserWidth","browserHeight","connectionType","homepage","plugins"];s.e=s.e.concat(i);s.H=s.H.concat(i);s.ssl=w.location.protocol.toLowerCase().indexOf("https")>=
        0;s.charSet="UTF-8";s.contextData={};s.offlineThrottleDelay=0;s.offlineFilename="AppMeasurement.offline";s.la=0;s.O=0;s.F=0;s.ka=0;s.linkDownloadFileTypes="exe,zip,wav,mp3,mov,mpg,avi,wmv,pdf,doc,docx,xls,xlsx,ppt,pptx";s.w=w;s.d=w.document;try{s.Pa=navigator.appName=="Microsoft Internet Explorer"}catch(o){}s.K=function(){if(s.L)w.clearTimeout(s.L),s.L=k;s.i&&s.A&&s.i.dispatchEvent(s.A);if(s.p)if(typeof s.p=="function")s.p();else if(s.i&&s.i.href)s.d.location=s.i.href;s.i=s.A=s.p=0};s.oa=function(){s.b=
        s.d.body;if(s.b)if(s.o=function(b){var a,c,e,d,f;if(!(s.d&&s.d.getElementById("cppXYctnr")||b&&b.Wa)){if(s.aa)if(s.useForcedLinkTracking)s.b.removeEventListener("click",s.o,!1);else{s.b.removeEventListener("click",s.o,!0);s.aa=s.useForcedLinkTracking=0;return}else s.useForcedLinkTracking=0;s.j=b.srcElement?b.srcElement:b.target;try{if(s.j&&(s.j.tagName||s.j.parentElement||s.j.parentNode))if(e=s.ga(),s.track(),e<s.ga()&&s.useForcedLinkTracking&&b.target){for(d=b.target;d&&d!=s.b&&d.tagName.toUpperCase()!=
        "A"&&d.tagName.toUpperCase()!="AREA";)d=d.parentNode;if(d&&(f=d.href,s.ia(f)||(f=0),c=d.target,b.target.dispatchEvent&&f&&(!c||c=="_self"||c=="_top"||c=="_parent"||w.name&&c==w.name))){try{a=s.d.createEvent("MouseEvents")}catch(g){a=new w.MouseEvent}if(a){try{a.initMouseEvent("click",b.bubbles,b.cancelable,b.view,b.detail,b.screenX,b.screenY,b.clientX,b.clientY,b.ctrlKey,b.altKey,b.shiftKey,b.metaKey,b.button,b.relatedTarget)}catch(i){a=0}if(a)a.Wa=1,b.stopPropagation(),b.Za&&b.Za(),b.preventDefault(),
            s.i=b.target,s.A=a}}}}catch(k){}s.j=0}},s.b&&s.b.attachEvent)s.b.attachEvent("onclick",s.o);else{if(s.b&&s.b.addEventListener){if(navigator&&(navigator.userAgent.indexOf("WebKit")>=0&&s.d.createEvent||navigator.userAgent.indexOf("Firefox/2")>=0&&w.MouseEvent))s.aa=1,s.useForcedLinkTracking=1,s.b.addEventListener("click",s.o,!0);s.b.addEventListener("click",s.o,!1)}}else setTimeout(s.oa,30)};s.oa()}
function s_gi(s){var w,k=window.s_c_il,m,i=s.split(","),n,p,o=0;if(k)for(m=0;!o&&m<k.length;){w=k[m];if(w._c=="s_c"&&w.account)if(w.account==s)o=1;else{if(!w.allAccounts)w.allAccounts=w.account.split(",");for(n=0;n<i.length;n++)for(p=0;p<w.allAccounts.length;p++)i[n]==w.allAccounts[p]&&(o=1)}m++}o||(w=new AppMeasurement);w.setAccount(s);return w}AppMeasurement.getInstance=s_gi;window.s_objectID||(window.s_objectID=0);
function s_pgicq(){var s=window,w=s.s_giq,k,m,i;if(w)for(k=0;k<w.length;k++)m=w[k],i=s_gi(m.oun),i.setAccount(m.un),i.setTagContainer(m.tagContainerName);s.s_giq=0}s_pgicq();
/*global window, AppMeasurement */

(function()
{
    'use strict';

    window.adobeAnalytics = window.adobeAnalytics || new AppMeasurement();
}());

(function(s)
{
    /*
     * Utility Functions: apl, p_c, p_gh, split, replace, join
     */
    s.apl=new Function("L","v","d","u",""
        +"var s=this,m=0;if(!L)L='';if(u){var i,n,a=adobeAnalytics.split(L,d);for(i=0;i<a."
        +"length;i++){n=a[i];m=m||(u==1?(n==v):(n.toLowerCase()==v.toLowerCas"
        +"e()));}}if(!m)L=L?L+d+v:v;return L");

    s.p_c=new Function("v","c",""
        +"var x=v.indexOf('=');return c.toLowerCase()==v.substring(0,x<0?v.le"
        +"ngth:x).toLowerCase()?v:0");

    s.p_gh=new Function(""
        +"var s=this;if(!adobeAnalytics.eo&&!adobeAnalytics.lnk)return '';var o=adobeAnalytics.eo?adobeAnalytics.eo:adobeAnalytics.lnk,y=adobeAnalytics.ot("
        +"o),n=adobeAnalytics.oid(o),x=o.s_oidt;if(adobeAnalytics.eo&&o==adobeAnalytics.eo){while(o&&!n&&y!='BODY'){"
        +"o=o.parentElement?o.parentElement:o.parentNode;if(!o)return '';y=adobeAnalytics."
        +"ot(o);n=adobeAnalytics.oid(o);x=o.s_oidt}}return o.href?o.href:'';");

    s.split=new Function("l","d",""
        +"var i,x=0,a=new Array;while(l){i=l.indexOf(d);i=i>-1?i:l.length;a[x"
        +"++]=l.substring(0,i);l=l.substring(i+d.length);}return a");

    s.repl=new Function("x","o","n",""
        +"var i=x.indexOf(o),l=n.length;while(x&&i>=0){x=x.substring(0,i)+n+x."
        +"substring(i+o.length);i=x.indexOf(o,i+l)}return x");

    s.join = new Function("v","p",""
        +"var s = this;var f,b,d,w;if(p){f=p.front?p.front:'';b=p.back?p.back"
        +":'';d=p.delim?p.delim:'';w=p.wrap?p.wrap:'';}var str='';for(var x=0"
        +";x<v.length;x++){if(typeof(v[x])=='object' )str+=adobeAnalytics.join( v[x],p);el"
        +"se str+=w+v[x]+w;if(x<v.length-1)str+=d;}return f+str+b;");

    /*
     * Plugin: getNewRepeat 1.2 - Returns whether user is new or repeat
     */
    s.getNewRepeat=new Function("d","cn",""
        +"var adobeAnalytics=this,e=new Date(),cval,sval,ct=e.getTime();d=d?d:30;cn=cn?cn:"
        +"'s_nr';e.setTime(ct+d*24*60*60*1000);cval=adobeAnalytics.c_r(cn);if(cval.length="
        +"=0){adobeAnalytics.c_w(cn,ct+'-New',e);return'New';}sval=adobeAnalytics.split(cval,'-');if(ct"
        +"-sval[0]<30*60*1000&&sval[1]=='New'){adobeAnalytics.c_w(cn,ct+'-New',e);return'N"
        +"ew';}else{adobeAnalytics.c_w(cn,ct+'-Repeat',e);return'Repeat';}");

    /*
     * Plugin: getVisitNum - version 3.0
     */
    s.getVisitNum=new Function("tp","c","c2",""
        +"var adobeAnalytics=this,e=new Date,cval,cvisit,ct=e.getTime(),d;if(!tp){tp='m';}"
        +"if(tp=='m'||tp=='w'||tp=='d'){eo=adobeAnalytics.endof(tp),y=eo.getTime();e.setTi"
        +"me(y);}else {d=tp*86400000;e.setTime(ct+d);}if(!c){c='s_vnum';}if(!"
        +"c2){c2='s_invisit';}cval=adobeAnalytics.c_r(c);if(cval){var i=cval.indexOf('&vn="
        +"'),str=cval.substring(i+4,cval.length),k;}cvisit=adobeAnalytics.c_r(c2);if(cvisi"
        +"t){if(str){e.setTime(ct+1800000);adobeAnalytics.c_w(c2,'true',e);return str;}els"
        +"e {return 'unknown visit number';}}else {if(str){str++;k=cval.substri"
        +"ng(0,i);e.setTime(k);adobeAnalytics.c_w(c,k+'&vn='+str,e);e.setTime(ct+1800000);"
        +"adobeAnalytics.c_w(c2,'true',e);return str;}else {adobeAnalytics.c_w(c,e.getTime()+'&vn=1',e)"
        +";e.setTime(ct+1800000);adobeAnalytics.c_w(c2,'true',e);return 1;}}");

    s.dimo=new Function("m","y",""
        +"var d=new Date(y,m+1,0);return d.getDate();");

    s.endof=new Function("x",""
        +"var t=new Date;t.setHours(0);t.setMinutes(0);t.setSeconds(0);if(x=="
        +"'m'){d=adobeAnalytics.dimo(t.getMonth(),t.getFullYear())-t.getDate()+1;}else if("
        +"x=='w'){d=7-t.getDay();}else {d=1;}t.setDate(t.getDate()+d);return "
        +"t;");

    /*
     * Plugin: Days since last Visit 1.1 - capture time from last visit
     */
    s.getDaysSinceLastVisit=new Function("c",""
        +"var s=this,e=new Date(),es=new Date(),cval,cval_s,cval_ss,ct=e.getT"
        +"ime(),day=24*60*60*1000,f1,f2,f3,f4,f5;e.setTime(ct+3*365*day);es.s"
        +"etTime(ct+30*60*1000);f0='Cookies Not Supported';f1='First Visit';f"
        +"2='More than 30 days';f3='More than 7 days';f4='Less than 7 days';f"
        +"5='Less than 1 day';cval=s.c_r(c);if(cval.length==0){s.c_w(c,ct,e);"
        +"s.c_w(c+'_s',f1,es);}else{var d=ct-cval;if(d>30*60*1000){if(d>30*da"
        +"y){s.c_w(c,ct,e);s.c_w(c+'_s',f2,es);}else if(d<30*day+1 && d>7*day"
        +"){s.c_w(c,ct,e);s.c_w(c+'_s',f3,es);}else if(d<7*day+1 && d>day){s."
        +"c_w(c,ct,e);s.c_w(c+'_s',f4,es);}else if(d<day+1){s.c_w(c,ct,e);s.c"
        +"_w(c+'_s',f5,es);}}else{s.c_w(c,ct,e);cval_ss=s.c_r(c+'_s');s.c_w(c"
        +"+'_s',cval_ss,es);}}cval_s=s.c_r(c+'_s');if(cval_s.length==0) retur"
        +"n f0;else if(cval_s!=f1&&cval_s!=f2&&cval_s!=f3&&cval_s!=f4&&cval_s"
        +"!=f5) return '';else return cval_s;");

    /*
     * Plugin: getAndPersistValue 0.3 - get a value on every page
     */
    s.getAndPersistValue=new Function("v","c","e",""
        +"var s=this,a=new Date;e=e?e:0;a.setTime(a.getTime()+e*86400000);if("
        +"v)s.c_w(c,v,e?a:0);return s.c_r(c);");

    /*
     * Utility Function: vpr - set the variable vs with value v
     */
    s.vpr=new Function("vs","v",
        "if(typeof(v)!='undefined' && vs){var s=this; eval('s.'+vs+'=\"'+v+'\"')}");

    /*
     * Partner Plugin: DFA Check 1.0 - Restrict DFA calls to once a visit, per report suite, per click
     * through. Used in conjunction with VISTA. Deduplicates SCM hits.
     */
    s.partnerDFACheck=new Function("cfg",""
        +"var s=this,c=cfg.visitCookie,src=cfg.clickThroughParam,scp=cfg.searchCenterParam,p=cfg.newRsidsProp,tv=cfg.tEvar,dl=',',cr,nc,q,g,gs,i,j,k,fnd,v=1,t=new Date,cn=0,ca=new Array,aa=new Array,cs=new A"
        +"rray;t.setTime(t.getTime()+1800000);cr=s.c_r(c);if(cr){v=0;}ca=s.split(cr,dl);if(s.un)aa=s.split(s.un,dl);else aa=s.split(s.account,dl);for(i=0;i<aa.length;i++){fnd = 0;for(j=0;j<ca.length;j++){if(aa[i] == ca[j]){fnd=1;}}if(!fnd){cs[cn"
        +"]=aa[i];cn++;}}if(cs.length){for(k=0;k<cs.length;k++){nc=(nc?nc+dl:'')+cs[k];}cr=(cr?cr+dl:'')+nc;s.vpr(p,nc);v=1;}if(s.wd)q=s.wd.location.search.toLowerCase();else q=s.w.location.search.toLowerCase();q=s.repl(q,'?','&');g=q.indexOf('&'+src.toLow"
        +"erCase()+'=');gs=(scp)?q.indexOf('&'+scp.toLowerCase()+'='):-1;if(g>-1){s.vpr(p,cr);v=1;}else if(gs>-1){v=0;s.vpr(tv,'SearchCenter Visitors');}if(!s.c_w(c,cr,t)){s.c_w(c,cr,0);}if(!s.c_r(c)){v=0;}r"
        +"eturn v>=1;");

    /* Function - read combined cookies v 0.41
     * LAST UPDATED: 06-05-2013
     * APP MEASUREMENT JS COMPATIBLE
     */
    if(!s.__ccucr){
        s.c_rr = s.c_r;
        s.__ccucr = true;
        function c_r(k){
            var s = this,d = new Date,v = s.c_rr(k),c = s.c_rspers(),i, m, e;
            if(v)return v;k = s.Util.urlDecode(k);i = c.indexOf(' ' + k + '=');c = i < 0 ? s.c_rr('s_sess') : c;
            i = c.indexOf(' ' + k + '=');m = i < 0 ? i : c.indexOf('|', i);
            e = i < 0 ? i : c.indexOf(';', i);m = m > 0 ? m : e;
            v = i < 0 ? '' : s.Util.urlDecode(c.substring(i + 2 + k.length, m < 0 ? c.length : m));
            return v;
        }
        function c_rspers(){
            var cv = s.c_rr("s_pers");var date = new Date().getTime();var expd = null;var cvarr = [];var vcv = "";
            if(!cv)return vcv; cvarr = cv.split(";");for(var i = 0, l = cvarr.length; i < l; i++){
                expd = cvarr[i].match(/\|([0-9]+)$/);if(expd && parseInt(expd[1]) >= date){vcv += cvarr[i] + ";";}}
            return vcv;
        }
        s.c_rspers = c_rspers;
        s.c_r = c_r;
    }

    /*
     * Function - write combined cookies v 0.41 
     */
    if(!s.__ccucw){
        s.c_wr = s.c_w;
        s.__ccucw = true;
        function c_w(k, v, e){
            var s = this,d = new Date,ht = 0,pn = 's_pers',sn = 's_sess',pc = 0,sc = 0,pv, sv, c, i, t;
            d.setTime(d.getTime() - 60000);if(s.c_rr(k))s.c_wr(k, '', d);k = s.Util.urlEncode(k);
            pv = s.c_rspers();i = pv.indexOf(' ' + k + '=');if(i > -1){
                pv = pv.substring(0, i) + pv.substring(pv.indexOf(';', i) + 1);pc = 1;}
            sv = s.c_rr(sn);i = sv.indexOf(' ' + k + '=');if(i > -1){
                sv = sv.substring(0, i) + sv.substring(sv.indexOf(';', i) + 1);sc = 1;}
            d = new Date;if(e){if(e.getTime() > d.getTime()){
                pv += ' ' + k + '=' + s.Util.urlEncode(v) + '|' + e.getTime() + ';';pc = 1;}}
            else{sv += ' ' + k + '=' + s.Util.urlEncode(v) + ';';sc = 1;}sv = sv.replace(/%00/g, '');
            pv = pv.replace(/%00/g, '');if(sc)s.c_wr(sn, sv, 0);if(pc){t = pv;
                while(t && t.indexOf(';') != -1){var t1 = parseInt(t.substring(t.indexOf('|') + 1, t.indexOf(';')));
                    t = t.substring(t.indexOf(';') + 1);ht = ht < t1 ? t1 : ht;}d.setTime(ht);
                s.c_wr(pn, pv, d);}return v == s.c_r(s.Util.urlEncode(k));}
        s.c_w = c_w;
    }
}(window.adobeAnalytics));
/*global AppMeasurement, window */

(function()
{
	'use strict';

	window.adobeAnalytics = window.adobeAnalytics || new AppMeasurement();
}());

(function(s) {

	s.configure = s.configure || {};

	/**
	 * Configures the use of the DFA Plugin
	 *
	 * @param config.SPOTID Advertiser ID that is specific per division
	 * @param config.maxDelay DoubleClick timeout delay (default is 750 ms)
	 * @param config.cookiePrefix Name to prepend to default cookie name
     */
	s.configure.dfa = function(config) {

		var dfaConfig = {
			CSID:               '', // DFA Client Site ID
			SPOTID:             config.SPOTID, // DFA Spotlight ID
			tEvar:              'eVar44', // Transfer variable, typically the "View Through" eVar.
			errorEvar:          'eVar45', // DFA error tracking (optional)
			timeoutEvent:       'event46', // Tracks timeouts/empty responses (optional)
			requestURL:         "http://fls.doubleclick.net/json?spot=[SPOTID]&src=[CSID]&var=[VAR]&host=integrate.112.2o7.net%2Fdfa_echo%3Fvar%3D[VAR]%26AQE%3D1%26A2S%3D1&ord=[RAND]", // the DFA request URL
			maxDelay:           config.maxDelay || "750", // The maximum time to wait for DFA servers to respond, in milliseconds.
			visitCookie:        config.cookiePrefix + "_s_dfa", // The name of the visitor cookie to use to restrict DFA calls to once per visit.
			clickThroughParam:  "dfaClick", // A query string parameter that will force the DFA call to occur.
			searchCenterParam:  undefined, // SearchCenter identifier.
			newRsidsProp:       undefined //"prop34" // Stores the new report suites that need the DFA tracking code. (optional)
		};


		s.maxDelay = dfaConfig.maxDelay;
		s.loadModule("Integrate")
		s.Integrate.onLoad=function(s,m) {
			var dfaCheck = s.partnerDFACheck(dfaConfig);
			if (dfaCheck) {
				s.Integrate.add("DFA");
				s.Integrate.DFA.tEvar=dfaConfig.tEvar;
				s.Integrate.DFA.errorEvar=dfaConfig.errorEvar;
				s.Integrate.DFA.timeoutEvent=dfaConfig.timeoutEvent;
				s.Integrate.DFA.CSID=dfaConfig.CSID;
				s.Integrate.DFA.SPOTID=dfaConfig.SPOTID;
				s.Integrate.DFA.get(dfaConfig.requestURL);
				s.Integrate.DFA.setVars=function(s,p) {
					if (window[p.VAR]) { // got a response
						if(!p.ec) { // no errors
							s[p.tEvar]="DFA-"+(p.lis?p.lis:0)+"-"+(p.lip?p.lip:0)+"-"+(p.lastimp?p.lastimp:0)+"-"+(p.lastimptime?p.lastimptime:0)+"-"+(p.lcs?p.lcs:0)+"-"+(p.lcp?p.lcp:0)+"-"+(p.lastclk?p.lastclk:0)+"-"+(p.lastclktime?p.lastclktime:0)
						} else if (p.errorEvar) { // got an error response, track
							s[p.errorEvar] = p.ec;
						}
					} else if (p.timeoutEvent) { // empty response or timeout
						s.events = ((!s.events || s.events == '') ? '' : (s.events + ',')) + p.timeoutEvent; // timeout event
					}
				}
			}
		}
	};

}(window.adobeAnalytics));
/*global AppMeasurement, window, unescape */

(function() {
    'use strict';

    window.adobeAnalytics = window.adobeAnalytics || new AppMeasurement();
}());

(function(s) {
    'use strict';
    var alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
        numbers  = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    //weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    //months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    s.support = s.support || {};

    /**
     * Remove leading and trailing white spaces from a string
     *
     * @param string the string to trim
     */
    s.support.trim = function(string) {
        if (string.trim) //feature detection
        {
            return string.trim();
        }
        return string.replace(/^\s+|\s+$/g, '');
    };

    /**
     * Loop through an array of strings and remove
     * element from array that matches a desired string.
     *
     * @param array an array of string
     * @param obj to string or object to match
     */
    s.support.removeDuplicate = function(array, obj) {
        var index = array.length,
            item;

        while (index--)
        {
            item = array[index];

            if (typeof item === 'string')
            {
                item = item.split('=')[0];
            }

            if (item === obj)
            {
                array.splice(index, 1);
                break;
            }
        }
    };

    /**
     * Returns true if parameter is an Array
     *
     * @param arr
     * @returns {boolean} true if type is an Array
     */
    s.support.isArray = function(arr) {
        if (!Array.isArray)
        {
            return Object.prototype.toString.call(arr) === '[object Array]';
        }
        return Array.isArray(arr);
    };

    /**
     * Returns a comma separated list as an array
     *
     * @param string the string to convert to an array
     */
    s.support.toArray = function(string) {
        return (typeof string === 'string' && string.length > 0 && string.split(',')) || (this.isArray(string) && string) || [];
    };

    /**
     * Returns true if parameter is an Object literal and not null or undefined
     *
     * @param obj
     * @returns {boolean} true if type is an Object
     */
    s.support.isObject = function(obj) {
        return Object.prototype.toString.call(obj) === '[object Object]'
            && !this.isNullOrUndefined(obj);
    };

    /**
     * Iterate over an Array or an Object
     *
     * @param obj Object|Array to iterate over
     * @param iterator function to execute for each iteration
     * @param context this?
     */
    s.support.forEach = function(obj, iterator, context) {
        var key, length;

        if (this.isArray(obj))
        {
            for (key = 0, length = obj.length; key < length; key++)
            {
                iterator.call(context, obj[key], key, obj);
            }
        }
        else if (this.isObject(obj))
        {
            for (key in obj)
            {
                if (obj.hasOwnProperty(key))
                {
                    iterator.call(context, obj[key], key, obj);
                }
            }
        }
    };

    /**
     * Cross browser compatibility for adding an event listener
     *
     * @param elem the elements to listen for event on
     * @param type the type of event
     * @param func function to execute when event is fired
     */
    s.support.addEventListener = function(elem, type, func) {
        if (elem.addEventListener)
        {
            elem.addEventListener(type, func, false);
        }
        else if (elem.attachEvent)
        { //attachEvent used for older browser support
            elem.attachEvent('on' + type, func);
        }
    };

    /**
     * Cross browser compatibility for removing an event listener
     *
     * @param elem the element
     * @param type tppe of event
     * @param func the function to remove for event type
     */
    s.support.removeEventListener = function(elem, type, func) {
        if (elem.removeEventListener)
        {
            elem.removeEventListener(type, func);
        }
        else if (elem.detachEvent)
        { // detachEvent used for older browser support
            elem.detachEvent(type, func);
        }
    };

    /**
     * Returns true if object is null or undefined
     *
     * @param value the Object
     * @returns {boolean} true if null or undefined
     */
    s.support.isNullOrUndefined = function(value) {
        return value === undefined || value === null;
    };

    /**
     * Returns a string value of a number.  If the number is a single
     * digit, a zero is prepended to the string
     *
     * @param num the number
     * @returns {string} number as string in minimum of 2 digit format
     */
    s.support.padZero = function(num) {
        var str = this.isNullOrUndefined(num) ? '' : num.toString();
        return (str.length === 1) ? ('0' + str) : str;
    };

    /**
     * Creates a copy of an Object or an Array
     *
     * @param obj the Object|Array to copy
     * @returns {*} copy of Object|Array
     */
    s.support.clone = function(obj) {
        var clone = null, key;
        if (this.isArray(obj))
        {
            clone = obj.slice(0);
        }
        else if (this.isObject(obj))
        {
            clone = obj.constructor();
            for (key in obj)
            {
                if (obj.hasOwnProperty(key))
                {
                    clone[key] = this.clone(obj[key]);
                }
            }
        }
        else
        {
            clone = obj;
        }
        return clone;
    };

    /**
     * Returns the index in an array where a given value exists
     *
     * @param obj String or Array
     * @param value the value to find
     */
    s.support.indexOf = function(obj, value) {
        var index = obj.length;
        if (obj.indexOf)
        {
            index = obj.indexOf(value);
        }
        else
        {
            while (index--)
            {
                if (obj[index] === value)
                { break; }
            }
        }
        return index;
    };

    /**
     * Convert a Date object to a string, according to universal time, and cross browser compatible
     *
     * @param date the date to convert
     * @returns {string} Date object to a string, according to universal time
     */
    s.support.toUTCString = function(date) {
        var utcString = date.toUTCString(),
            index     = utcString.search(/\s\d\s/g);
        //prepend a 0 to date number if single digit (Legacy IE browsers)
        utcString = (index !== -1) ? [utcString.slice(0, index + 1), '0', utcString.slice(index + 1)].join('') : utcString;
        return utcString.replace('GMT', 'UTC'); //IE Edge returns GMT, so replace with UTC
    };

    /**
     * Get the Date for a given timezone
     *
     * @param timeZoneOffset timezone offset
     * @param dstObserved daylight savings time observed for timezone
     */
    s.support.getDate = function(timeZoneOffset, dstObserved) {
        var now = new Date();
        if (dstObserved && this.isDSTActive(now))
        {
            timeZoneOffset++;
        }
        return new Date(now.getTime() + (3600000 * timeZoneOffset));
    };

    /**
     * Determines if Daylight Savings is active for a given date
     *
     * @param date the date
     * @returns {boolean} true if active
     */
    s.support.isDSTActive = function(date) {
        var jan       = new Date(date.getFullYear(), 0, 1), //January 1st
            july      = new Date(date.getFullYear(), 6, 1), //July 1st
            offset    = date.getTimezoneOffset(),
            stdOffset = Math.max(jan.getTimezoneOffset(), july.getTimezoneOffset());
        return offset < stdOffset;
    };

    /**
     * Concatenates a string to another string, and delimited by a defined delimiter
     *
     * @param org string to concat to
     * @param str the string to concat to org
     * @param del delimiter or a comma
     * @returns {string|*}
     */
    s.support.concat = function(org, str, del) {
        var arr = org.split(del || ',');
        arr.push(str);
        return arr.join(del);
    };

    /**
     * Creates a random string with a length of a defined character count
     *
     * @param length number of characters
     */
    s.support.randomString = function(length) {
        var characters = alphabet.concat(numbers),
            random     = '', idx;
        for (idx = 0; idx < length; idx++)
        {
            random += characters[Math.round(Math.random() * (characters.length - 1))];
        }
        return random;
    };

    /**
     * Cross browser mechanism for determining the base of a given URL href
     *
     * @param href
     */
    s.support.getBaseURL = function(href) {
        var anchor = document.createElement('a'),
            url    = '';

        anchor.href = href;

        url += (anchor.protocol + '//');
        url += anchor.hostname;
        url += (anchor.port && this.indexOf(['80', '0', '443'], anchor.port) === -1) ? (':' + anchor.port) : '';
        url += this.indexOf(anchor.pathname, '/') === 0 ? anchor.pathname : ('/' + anchor.pathname);
        url += (anchor.hash.indexOf('?') !== -1) ? anchor.hash.substring(0, anchor.hash.indexOf('?')) : anchor.hash;

        return url;
    };

    /**
     * Returns the content value of a meta tag
     *
     * @param tagName the name of the meta tag
     * @returns {string} value of centent of meta tag
     */
    s.support.getMetaTagContent = function(tagName) {
        var metaTags = document.getElementsByTagName('meta'),
            index    = metaTags.length,
            content  = '';
        while (index--)
        {
            if (metaTags[index].name === tagName)
            {
                content = metaTags[index].content;
                break;
            }
        }
        return content;
    };

    /**
     * Creates a anchor element using a defined href, and pulls its hostname property
     * from it.
     *
     * @param href the href
     */
    s.support.getHostName = function(href) {
        var anchor = document.createElement('a');
        anchor.href = href;
        return anchor.hostname || anchor.cloneNode(false).hostname;
    };

    /**
     * Removes the index of an array, whos value is equal to a defined string
     *
     * @param arr the array
     * @param item the value
     *
     * @returns Array - array with item removed
     */
    s.support.removeArrayItem = function(arr, item) {
        //clone array to prevent side-effects
        var clone = arr.slice(0),
            index = this.indexOf(clone, item);

        if (index >= 0)
        {
            clone.splice(index, 1);
        }

        return clone;
    };

    /**
     * Remove items from an array that does not meet validation
     *
     * @param array the array to filter
     * @param func validation function that returns a boolean.
     */
    s.support.filterArray = function(array, func) {
        var index = array.length;
        while (index--)
        {
            if (!func(array[index]))
            {
                array.splice(index, 1);
            }
        }
    };

    /**
     * Sanitizers helper function. removes the property from the newObj when it is done
     * @param isValid validator against the value located in the object
     * @param key the key property where the value should be located in the objects
     * @param oldObj the object where the old value stored in key is located
     * @param newObj the object where the new value stored in key is located
     * @param defaultValue default value that would be assigned if not valid
     * @returns {*}
     */
    s.support.sanitizeHelper = function(isValid, key, oldObj, newObj, defaultValue) {
        var oldVal = oldObj && oldObj[key],
            newVal = newObj && newObj[key],
            value = isValid(oldVal) ? oldVal : defaultValue;
        newVal = s.support.isObject(newVal) ? newVal.value : newVal;
        if (!this.isNullOrUndefined(newVal))
        {
            delete newObj[key];
        }
        return isValid(newVal) ? newVal : value;
    };

    /**
     * Returns the old value if new value is not a string.  If old
     * value is not a string, then the defaultValue is returned (when provided)
     * or an empty string.
     *
     * @param key property in the object where the value is stored
     * @param oldObj the current object
     * @param newObj the new object
     * @param defaultValue the value to set when neither oldVal or newVal are valid.  Defaults to empty string.
     */
    s.support.sanitizeString = function(key, oldObj, newObj, defaultValue) {
        return this.sanitizeHelper(function(value){
            return typeof value === 'string';
        }, key, oldObj, newObj, defaultValue || '');
    };

    /**
     * Returs the old value when the new value is not an integer number. Returns NaN if oldValue is undefined
     *
     * @param key property in the object where the value is stored
     * @param oldObj the current object
     * @param newObj the new object
     * @param defaultValue
     * @returns {number}
     */
    s.support.sanitizeInt = function(key, oldObj, newObj, defaultValue) {
        return this.sanitizeHelper(function(value){
            return typeof value === 'number';
        }, key, oldObj, newObj, defaultValue || NaN);
    };

    /**
     * Returns the old value if new value is not a boolean.  Returns false
     * if old value is not a boolean.
     *
     * @param key property in the object where the value is stored
     * @param oldObj the current object
     * @param newObj the new object
     * @param defaultValue
     * @return {boolean}
     */
    s.support.sanitizeBoolean = function(key, oldObj, newObj, defaultValue) {
        return this.sanitizeHelper(function(value){
            return typeof value ==='boolean';
        }, key, oldObj, newObj, defaultValue || false);
    };

    /**
     * Returns the old value when new value is not an array.  Returns an
     * empty array when old value is not an array
     *
     * @param key property in the object where the value is stored
     * @param oldObj the current object
     * @param newObj the new object
     * @return {Array}
     */
    s.support.sanitizeArray = function(key, oldObj, newObj) {
        return this.sanitizeHelper(this.isArray, key, oldObj, newObj, []);
    };

    s.support.cookies = {

        read: function(name) {

            var cookie = s.Util.cookieRead(name),
                values = cookie.split(';'),
                index = values.length,
                str, expires;

            while(index--){
                str = values[index];
                expires = str.indexOf('|');

                values[index] = {
                    name: s.support.trim(str.substring(0, str.indexOf('='))),
                    value: expires > 0 ? str.substring(str.indexOf('=') + 1, expires) : str.substring(str.indexOf('=') + 1, str.length),
                    expiration: expires > 0 ? str.substring(str.indexOf('|') + 1, str.length) : '0'
                };

                values[index].value = s.Util.urlDecode(values[index].value);

                if(!values[index].name) {
                    values.splice(index, 1);
                }
            }

            return values;
        }
    };

    s.support.isValidCookieName = function(name) {
        var configData = window.webAnalytics.config_data,
            prefix = configData.country && configData.country !== 'us'? (configData.country + '_') : '';
        return (/_s_[A-Za-z0-9]+_per/).test(name)
            && name.substring(0, name.indexOf('_s_')) === (prefix + configData.siteIdentifier);
    };

    /**
     * reads the cookie in the specified location and returns the value if in the valid Vanguard cookie name
     * @param location
     * @param name
     */
    s.support.getCookieValueFrom = function(location, name) {
        var isValidCookieName = this.isValidCookieName,
            value;
        this.forEach(this.cookies.read(location), function(cookie) {
            if (cookie.name.substring(cookie.name.indexOf('_s_') + 3, cookie.name.indexOf('_per')) === name && isValidCookieName(cookie.name))
            {
                value = cookie.value;
            }
        });
        return value;
    };

    /**
     * Reads the session and persistent cookies and returns the value
     * associated to the key name
     * @param key property name requested
     */
    s.support.getPropertyFromCookie = function(key) {
        // Read from s_pers then from s_sess if not found
        return this.getCookieValueFrom('s_sess', key) || this.getCookieValueFrom('s_pers', key) || '';
    };

}(window.adobeAnalytics));
/*global AppMeasurement, vgDevice, Visitor, window */

(function() {
    'use strict';

    window.adobeAnalytics = window.adobeAnalytics || new AppMeasurement();
}());

(function(s) {
    'use strict';

    /**
     * Creates the account string for Adobe Analytics reporting.  This is done by
     * replacing the <environment> and <siteDescriptor> in the report suite names
     * with the appropriate values.
     *
     * @param data
     * @param isCrew
     * @returns {string}
     */
    var createAccountsString = function(data, isCrew) {
        var support = s.support,
            vgCrewSuite = 'vanguardcrew' + data.environment,
            suites = data.reportSuiteIds ? support.clone(data.reportSuiteIds) : [];

        support.forEach(suites, function(value, key) {
            var siteDescriptor = (data.country && data.country !== 'us') ? data.country : data.siteIdentifier ;

            value = value.replace(/<environment>/g, data.environment);
            value = value.replace(/<siteDescriptor>/g, siteDescriptor);
            suites[key] = value;
        });

        return isCrew ? vgCrewSuite : suites.join(',');
    },

    /**
     * Constructs the prefix for the cookie names to avoid
     * overlapping cookies with other Vanguard domains.  International
     * sites will have the cookie names prefixed with country_siteID, and
     * domestic sites will be prefixed with just the siteID
     *
     * @param config webAnalytics.confg_data
     * @returns {string} prefix for cookie
     */
    constructCookiePrefix = function(config) {
        var prefix = [];
        if(config.country && config.country !== 'us') {
            prefix.push(config.country);
        }
        prefix.push(config.siteIdentifier);

        return prefix.join('_');
    },

    /**
     * Update values in s_pers and s_sess cookies and returns the updated
     * value
     *
     * @param key name of the property stored in cookie
     * @param value the new value of that property
     * @param expiration the number of days the cookie will expire
     * @returns {*}
     */
    persistInCookie = function(key, value, expiration) {
        var webAnalytics = window.webAnalytics,
            prefix = constructCookiePrefix(webAnalytics.config_data),
            cookie =  prefix + '_s_' + key + '_per';

        return s.getAndPersistValue(value, cookie, expiration);
    },

    /**
     * Creates a new random Visitor ID
     *
     * Format: MCAID|{16 random letter/number}-{16 random letter/number}
     *
     * @returns {string}
     */
    generateVisitorID = function() {
        var support = s.support;
        return 'MCAID|' + support.randomString(16) + '-' + support.randomString(16);
    },

    /**
     * For WAVE and TIDE applications, looking up new clients requires a session reset.
     * To achieve this the AMCV_vanguard is cleared and a new visitor ID is created.  The cookie
     * is then updated with that new Visitor ID.  The new visitor ID is then assigned on contextData.
     *
     * @param config_data webAnalytics.config_data object
     */
    resetVisitorID = function(config_data) {
        var site = config_data.siteIdentifier ? config_data.siteIdentifier.toLowerCase() : '',
            visitorId = null,
            contextData = s.contextData,
            now = new Date();

        if(site === 'wave' || site === 'tide') {
            s.visitor = null;
            contextData.visitorId = null;

            if(!s.Util.cookieRead('AMCV_vanguard')) { //if cookie has been cleared
                visitorId = generateVisitorID();
                s.Util.cookieWrite('AMCV_vanguard', visitorId, new Date(now.getTime() + (2 * 365 * 86400000)));
            }
            s.visitorID = s.Util.cookieRead("AMCV_vanguard").replace('MCAID|', '');
        }
    },

    /**
     * Constructs the page name using the various pieces in the webAnalytics.config_data
     * in the below format, and in all lowercase.  Any pieces that are missing from the page
     * name are removed from the final string.
     *
     * {country}:{language}:{siteIdentifier}:{platform}:{domain}:{section}:{subSection}:{pageId}:{subViewId}
     *
     * @param config webAnalytics.config_data
     * @returns {string} pageName
     */
    constructPageName = function(config) {
        var pageName = [];

        pageName.push(config.country);
        pageName.push(config.language);
        pageName.push(config.siteIdentifier);
        pageName.push(config.platform);
        pageName.push(config.domain); //extractDomain(href)???
        pageName.push(config.section);
        pageName.push(config.subSection);
        pageName.push(config.pageId); //extractPageId(href)????

        //Check for subViewId to prevent extra ending colon for international pageNames
        if(config.subViewId) {
            pageName.push(config.subViewId);
        }

        // remove any indexes that do not have a values (US only)
        if(config.country === 'us'){
            s.support.filterArray(pageName, function(item) {
                return item && item !== ' ';
            });
        }

        return pageName.join(':').toLowerCase();
    },

    /**
     * Reads the properties stored in a given cookie and returns those propoerties
     * in an array of objects that contain the property name, value, and expiration in
     * milliseconds (if available)
     *
     * @param cookieName the name of the cookie
     */
    setContextDataFromCookie = function(cookieName) {
        var webAnalytics = window.webAnalytics,
            prefix = constructCookiePrefix(webAnalytics.config_data);

        s.support.forEach(s.support.cookies.read(cookieName), function(cookie, key) {
            var name = '';

            if(/_s_[A-Za-z0-9]+_per/.test(cookie.name) && cookie.name.substring(0, cookie.name.indexOf('_s_')) === prefix) {
                name = cookie.name.substring(cookie.name.indexOf('_s_') + 3, cookie.name.indexOf('_per'));
                s.contextData[name] = cookie.value;
            }
        });
    },

    /**
     * When the Vanguard native mobile application frames in Vanguard pages,
     * we need to capture the query parameters from the mobile app to associate
     * the page view and visitor with the mobile app, and not the website
     *
     * 1.) Use native applications visitorId, so only counts as a single visit
     * 2.) Change the siteIdentifier and environment to mobile values
     * 3.) Store mobile data in cookie so tracking is consistent
     *
     * @param config window.webAnalytics.config_data
     */
    nativeAppHandling = function(config) {
        var visitorId = s.Util.getQueryParam("mid"),
            environment = s.Util.getQueryParam("menv"),
            siteIdentifier = s.Util.getQueryParam("mdesc"),
            cookieValue = s.Util.cookieRead('s_mid');

        if(visitorId !== '' && environment !== '' && siteIdentifier !== '') {
            cookieValue = visitorId + '~' + siteIdentifier + '~' + environment;
            s.Util.cookieWrite('s_mid', cookieValue);
        }

        if(cookieValue) {
            s.contextData.visitorId = s.analyticsVisitorID = cookieValue.split('~')[0];
            config.siteIdentifier = cookieValue.split('~')[1];
            config.environment = cookieValue.split('~')[2];
        }
    },

    /**
     * Determines the number of days since the user last visited a Vanguard
     * website.  If user never visited website, a cookie is set with the
     * current timestamp in milliseconds.
     *
     * Calculation: (Today(ms) - cookie (ms))/ ms in day
     *
     * @param config window.webAnalytics.config_data
     *
     */
    getDaysSinceFirstVisit = function(config) {
        var now = new Date(),
            two_years = new Date(now.getTime()),
            cookieName = constructCookiePrefix(config) + '_fvt',
            firstVisit = s.Util.cookieRead(cookieName),
            msInDay = (1000 * 60 * 60 * 24);

        two_years.setYear(two_years.getFullYear() + 2);

        if(!firstVisit) {
            firstVisit = now.getTime();
            s.Util.cookieWrite(cookieName, firstVisit, two_years);
        }

        return Math.round((now.getTime() - parseInt(firstVisit, 10)) / msInDay).toString();
    },

    constructChannel = function(config) {
        var channel = [];

        if(config.country !== 'us') {
            channel.push(config.country);
            channel.push(config.language);
        }
        channel.push(config.siteIdentifier);
        channel.push(config.platform);

        return channel.join(':').toLowerCase();
    };

    /*******************************************
     * Configuration consistent across divisions
     *******************************************/
    s.ssl = true;	//always force adobe calls to be in https://
    s.trackDownloadLinks = true;
    s.trackExternalLinks = true;
    s.trackInlineStats = false;
    s.linkLeaveQueryString = false;
    s.linkTrackEvents = "None";
    s.linkTrackVars = "None";
    s.linkDownloadFileTypes = "exe,zip,wav,mp3,mov,mpg,avi,wmv,pdf,doc,docx,xls,xlsx,ppt,pptx";
    s.trackingServer = "vanguard.d2.sc.omtrdc.net";
    s.usePlugins = true;

    /*******************************************
     * Visitor
     *******************************************/
    s.visitor = Visitor.getInstance("vanguard");
    s.visitor.trackingServer = "vanguard.d2.sc.omtrdc.net";
    s.visitorNamespace = "vanguard";

    //Project Version Number
    //s.contextData.versionNumber = '2.0.0-M20160414-01';

    /**
     * Function used to synchronize values to the AppMeasurement Objects
     *
     * Notes: This function is to be called before making s.t() and s.tl() calls
     */
    s.populateAAVars = function() {

        var wA = window.webAnalytics || {},
            contextData = s.contextData,
            config_data = wA.config_data || {},
            context_data = wA.context_data || {},
            page_data = wA.page_data || {},
            dfa_data = wA.dfa_data || {},
            event_data = wA.event_data || {},
            javascript = 'javascript',
            timeZoneOffset = s.support.isNullOrUndefined(config_data.timeZoneOffset) ? -5 : config_data.timeZoneOffset,
            dstObserved = s.support.isNullOrUndefined(config_data.dstObserved) ? true : config_data.dstObserved,
            now = s.support.getDate(timeZoneOffset,dstObserved), //default to EST
            nowUTCStr = s.support.toUTCString(now),
            timeZone = s.support.isDSTActive(now) ? 'EDT' : 'EST';

        /**
         * Native Mobile App handling needs to execute before all other variables are set,
         * because it will update the values for environment, siteIdentifier, and the visitorId
         * if the viewed page is framed in by the mobile application.
         *
         * DO NOT MOVE THIS LINE OF CODE EVER!!! MUST EXECUTE BEFORE ALL OTHER CODE in this function
         */
        nativeAppHandling(config_data);

        /**
         * Country and site specific application configuration
         *
         * Some configuration variables could not be hard coded, because the are different from country to country.
         * If the configuration variables are not provided, a domestic (US) value is assigned as a default.
         */
        s.charSet = config_data.charSet || "ISO-8859-1";
        s.currencyCode = config_data.currencyCode || "USD";
        s.linkInternalFilters = javascript + ':,' + (config_data.linkInternalFilters || "vanguard.com");
        s.pageType = config_data.pageNotFound ? 'errorPage' : '';
        s.hier1 = config_data.section + ':' + config_data.subSection;
        s.channel = constructChannel(config_data);

        //used by international sites
        s.cookieDomainPeriods = (s.support.isNullOrUndefined(config_data.cookieDomainPeriods)) ? null : config_data.cookieDomainPeriods;
        s.campaign = s.Util.getQueryParam('cmpgn');

        /**
         * Non contextData properties.
         *
         * These properties are values required by Adobe for page identification and report suite
         */
        s.pageName = config_data.pageNotFound ? '' : (page_data.pageName || constructPageName(config_data));
        s.pageURL = ''; //Reset pageURL for AngularJS applications
        s.account = createAccountsString(config_data, config_data.crewFlag);

        //Context Data
        contextData.daysSinceFirstVisit = contextData.daysSinceFirstVisit || getDaysSinceFirstVisit(config_data);
        contextData.siteSection1 = config_data.pageNotFound ? '' : config_data.section;
        contextData.siteSection2 = config_data.pageNotFound ? '' : config_data.subSection;
        contextData.pageTitle = document.title;
        contextData.pageUrl = s.support.getBaseURL(window.location.href);
        contextData.timeStamp = nowUTCStr.substr(0, nowUTCStr.length - 7) + ' ' + (config_data.timeZone || timeZone);
        contextData.calendarDay = nowUTCStr.substr(0, nowUTCStr.length - 13);
        contextData.businessLine = config_data.businessLine;

        /**
         * Sync all values stored on window.webAnalytics.context_data to the window.adobeAnalytics.contextData object.
         *
         * 1.) Loop through all properties on wA.context_data
         * 2.) If property value is not an object, assign it directly to s.contextData
         * 3.) If property is an object, with a value and expiration properties, persist the value in the cookie
         *     for the desired expiration period (365*2 for 2 years and 0 for session)
         * 4.) CBD templates can report a value as "notimplemented" when application teams do not set the property server
         *     side, so we need to report those values as empty strings
         */
        s.support.forEach(context_data, function(value, key){
            var val = s.support.isObject(value) ? persistInCookie(key, value.value, value.expiration) : value;
            val = (typeof val === 'string' && val.toLowerCase() === 'notimplemented') ? '' : val;
            this[key] = val;
        }, contextData);


        /**
         * Read the 2 adobe cookies (s_pers and s_sess) for persisting variables set on contextData.
         *
         * This is used when on previous pages, a contextData variable was stored in a cookie, but on the present page
         * it does not exist.  This will ensure the value is reported on track and track link calls.  Reads all values
         * with a key in the following format: {siteIdentifier}_s_{property name}_per, and set the propertyName: value
         * pair on contextData.
         */
        setContextDataFromCookie('s_pers');
        setContextDataFromCookie('s_sess');

        //Set event specific variables
        s.linkTrackVars = event_data.linkTrackVars || 'None';
        s.linkTrackEvents = event_data.linkTrackEvents || 'None';
        s.events = event_data.events || '';

        /**
         * Application teams can set a flag to reset session.  Resetting the session does the following:
         * 1.) Clears out Adobe specific cookies that were set during a users visit.
         * 2.) Assigns the user a new Visitor ID
         * 3.) Set the resetSession flag to false
         */
        if(config_data.resetSession) {
            resetVisitorID(config_data);
            config_data.resetSession = false;
        }
        contextData.visitorId = contextData.visitorId || s.Util.cookieRead("AMCV_vanguard");

        /**
         * DFA Configuration = DoubleClick for Advertisers
         *
         * Retrieve data from DoubleClick servers to determine if a user was exposed
         * to an advertisement that lead them to land on Vanguards website
         */
        if(dfa_data.enabled === true) {
            //prefix dfa cookie with site descriptor
            dfa_data.cookiePrefix = constructCookiePrefix(config_data);
            s.configure.dfa(dfa_data);
        }
    };

    /**
     * Execute plugins before s.t() and s.tl() calls.
     * Executes if s.usePlugins === true.
     *
     * @param s AppMeasurement Object
     */
    s.doPlugins = function(s) {
        var webAnalytics = window.webAnalytics,
            config_data = webAnalytics.config_data,
            timeZoneOffset = s.support.isNullOrUndefined(config_data.timeZoneOffset) ? -5 : config_data.timeZoneOffset,
            dstObserved = s.support.isNullOrUndefined(config_data.dstObserved) ? true : config_data.dstObserved,
            now = s.support.getDate(timeZoneOffset,dstObserved), //default to EST
            prefix = constructCookiePrefix(config_data);

        /* Hour of day */
        s.contextData.hourOfDay = now.getUTCHours().toString();

        /* Day of week */
        s.contextData.dayOfWeek = now.getUTCDay() + 1; // 1-7, where 1 is Sunday

        /* Get the Visit Number */
        s.contextData.visitNumber = s.getVisitNum(null, prefix + '_s_vnum', prefix + '_s_invisit');

        /* Get the Days Since Last Visit */
        s.contextData.daysSinceLastVisit = s.getDaysSinceLastVisit(prefix + '_dslv_plug');
    };
}(window.adobeAnalytics));/*global AppMeasurement, vgDevice, window, beforeEach */

(function(s) {
    'use strict';

    var device = (window.vgDevice) ? new vgDevice.Device() : null;

    s.contextData.deviceOrientation = device ? device.orientation.type : 'NotAvail';

    s.vg = { events: {} };

    s.vg.events.orientationChange = function(event) {
        var detail = event.detail,
            contextData = s.contextData;

        if(detail && detail.count === 1) {
            contextData.orientationChanged = '1'; //1 Count
            contextData.deviceOrientation = detail.type; //Set landscape or portrait
            s.linkTrackVars='contextData.deviceOrientation,contextData.orientationChanged';
            s.tl(true, 'o', 'Orientation Change', null, function() {
                s.linkTrackVars = 'None';
                contextData.orientationChanged = null;
            });
            s.support.removeEventListener(window, 'vgDeviceOrientationChange', s.vg.events.orientationChange);
            device.unregister(); //remove listeners performed by device object
        }
    };

    s.support.addEventListener(window, 'vgDeviceOrientationChange', s.vg.events.orientationChange);

}(window.adobeAnalytics));/*global window */

/**********************************************************************************
 * Initialize Adobe Analytics Implementation
 *********************************************************************************/
(function(s) {
    'use strict';
    var impl = {};

    /**
     * Reset/Initialize cache values
     */
    impl.reset = function() {
        var configData        = window.webAnalytics.config_data,
            getMetaTagContent = s.support.getMetaTagContent;

        configData.trackingEnabled = true;
        configData.domain = '';
        configData.subViewId = '';
        configData.url = '';
        configData.siteIdentifier = getMetaTagContent('WebAnalytics.siteId');
        configData.pageNotFound = (getMetaTagContent('WebAnalytics.errorPage') === '404');
        configData.platform = (getMetaTagContent('WebAnalytics.platform') || 'web');
        configData.section = getMetaTagContent('WebAnalytics.contentGroup');
        configData.subSection = getMetaTagContent('WebAnalytics.contentSubGroup');
        configData.pageId = getMetaTagContent('WebAnalytics.pageName');
        configData.country = (getMetaTagContent('WebAnalytics.country') || 'us');
        configData.language = (getMetaTagContent('WebAnalytics.language') || 'en');
    };

    impl.reset(); //load defaults for local cache
    window.adobeAnalyticsImpl = s.implementation = impl;

}(window.adobeAnalytics));

/*******************************************************************************
 * Add Event
 ******************************************************************************/
(function(s) {
    'use strict';
    var impl                   = s.implementation,
        CONTEXT_DATA           = 'contextData.',
        EVENTS                 = 'events',
        NONE                   = 'None',

        /**
         * Adds the event descriptor to the events array.  Add the event descriptor
         * as an object when the name does not have a standard event name (starts with event),
         * otherwise append the event count to the name and push onto the array.
         *
         * @param eventData window.webAnalytics.event_data
         * @param event the new event
         */
        processEventObject     = function(eventData, event) {
            var name         = event.name,
                webAnalytics = window.webAnalytics,
                count        = event.count || 1,
                events       = s.support.toArray(eventData.events);
            if (name.indexOf('event') !== 0) //does not start with 'event'
            {
                webAnalytics.context_data[name] = count;
            }
            else
            {
                s.support.removeDuplicate(events, name);
                events.push(name + (count > 0 ? ('=' + count) : ''));//append count info when > 0
            }
            return events.join(',');
        },

        /**
         * Add event track variables to linkTrackVars to be sent when making a
         * trackLink call.
         *
         * @param eventData window.webAnalytics.event_data
         * @param event the new event
         */
        processLinkTrackVars   = function(eventData, event) {
            var name          = event.name,
                vars          = s.support.toArray(event.vars),
                linkTrackVars = s.support.toArray(eventData.linkTrackVars),
                index, temp;
            if (name.indexOf('event') !== 0) //name does NOT start with 'event'
            {
                //Since event name is placed on contextData, we place its contextData
                //name on linkTrackVars so that variable is sent in a trackLink request
                name = CONTEXT_DATA + name;
                s.support.removeDuplicate(linkTrackVars, name);
                linkTrackVars.push(name);
            }
            else if (s.support.indexOf(linkTrackVars, EVENTS) === -1)
            {
                linkTrackVars.push(EVENTS);
            }

            index = vars.length;
            while (index--)
            {
                temp = s.support.trim(vars[index]);
                temp = (temp.indexOf('prop') !== 0 && temp.indexOf('eVar') !== 0) ? (CONTEXT_DATA + temp) : temp;
                s.support.removeDuplicate(linkTrackVars, temp);
                linkTrackVars.push(temp);
            }

            //Remove 'None' from linkTrackVars, if array length > 1 and contains 'None'
            s.support.removeDuplicate(linkTrackVars, NONE);

            return linkTrackVars.join(',');
        },

        /**
         * Add the event name to linkTrackEvents only if
         * the event name starts with 'event'
         *
         * @param eventData window.webAnalytics.event_data
         * @param event the new event
         */
        processLinkTrackEvents = function(eventData, event) {
            var name            = event.name,
                linkTrackEvents = s.support.toArray(eventData.linkTrackEvents);

            s.support.removeDuplicate(linkTrackEvents, 'None');
            if (name.indexOf('event') === 0)
            {
                s.support.removeDuplicate(linkTrackEvents, name);
                linkTrackEvents.push(name);
            }

            return linkTrackEvents.join(',');
        };

    /**
     * Add an event
     *
     * @param event.name name of event
     * @param event.count event count
     * @param event.vars [] of variables to track with event
     */
    impl.addEvent = function(event) {
        var eventData = window.webAnalytics.event_data ;

        eventData.events = processEventObject(eventData, event);
        eventData.linkTrackVars = processLinkTrackVars(eventData, event);
        eventData.linkTrackEvents = processLinkTrackEvents(eventData, event);
    };
}(window.adobeAnalytics));

/**********************************************************************************
 * Track and Track Link
 *********************************************************************************/
(function(s) {
    'use strict';

    var impl             = s.implementation,

        /**
         * Resets Event and Custom Variable properties.
         *
         * @param webAnalytics the window.webAnalytics object
         */
        cleanup          = function(webAnalytics) {
            //loop through linkTrackVars names, and reset contextData for events
            s.support.forEach(webAnalytics.context_data, function(value, name) {
                webAnalytics.context_data[name] = undefined;
            });
            //After events have been cleared from contextData, all event
            //related variables can be reset
            webAnalytics.event_data = {
                events          : '',
                linkTrackEvents : 'None',
                linkTrackVars   : 'None'
            };
            //Clearing custom context_data
            s.populateAAVars();
            webAnalytics.context_data = {};
        },

        /**
         * Verifies the page being tracked was served from a Vanguard domain.
         * @param configData where the internal filters are defined
         */
        isInternalDomain = function(configData) {
            var domains  = configData.linkInternalFilters ? configData.linkInternalFilters.split(',') : [],
                index    = domains.length,
                match    = false,
                js       = ['javascript', ':'].join(''),
                hostname = s.support.getHostName(window.location.href),
                domain;

            domains = s.support.removeArrayItem(domains, js);

            while (index--)
            {
                domain = domains[index];
                if (hostname.indexOf(domain) >= 0)
                {
                    match = true;
                    break;
                }
            }

            return match;
        };

    /**
     * Track ~ s.t()
     *
     * This functions is primarily used to send data to Adobe report suites on page load.
     * It does the following things:
     *    1. Create an event called 'pageScreenView' to notify Adobe of the page load event.
     *    2. Verifies this Javascript file is used on on a page hosted withing the *.vanguard.com domain
     *    3. Sync the data between the window.webAnalytics and window.AppMeasurement object
     *    4. Performs the image request to send window.AppMeasurement attributes to report suites
     *    5. Determine a timeout based off the DFA maxdelay.
     *    6. Performs after track cleanup (see cleanup function)
     */
    impl.track = function() {
        var webAnalytics    = window.webAnalytics,
            pageLoad        = {
                name  : 'pageScreenView',
                count : 1,
                vars  : []
            },
            eventData       = webAnalytics.event_data, //event data
            isVanguard      = isInternalDomain(webAnalytics.config_data),
            trackingEnabled = webAnalytics.config_data.trackingEnabled,
            dfa, dfaDelay, delay;

        impl.addEvent(pageLoad);

        //s.t() sends all properties, so set to 'None'... because it does not matter
        eventData.linkTrackEvents = 'None';
        eventData.linkTrackVars = 'None';

        if (isVanguard && trackingEnabled)
        {
            s.populateAAVars();
            s.t();
        }

        dfa = webAnalytics.dfa_data;
        dfaDelay = dfa.maxDelay ? parseInt(dfa.maxDelay, 10) : 750; //ms
        delay = dfaDelay + 250; //ms

        //The s.t() call to send the data to Adobe can be postponed, due to neededing
        //DFA data and the Visitor ID.  We delay the cleanup of custom variables and
        //events to ensure they are not set to empty strings before the data is sent.
        //The delay is calculated as the maxDelay for DFA requests + a 250 ms buffer
        setTimeout(function() {
            cleanup(webAnalytics);
        }, delay);
    };

    /**
     * Track Link ~ s.tl()
     *
     * @param link.type d=download, e=exit, o=custom
     * @param link.name name of link in reports
     * @param link.overrides update variable values for single call
     * @param link.callback
     */
    impl.trackLink = function(link) {
        var webAnalytics    = window.webAnalytics,
            type            = link.type,
            name            = link.name,
            overrides       = link.overrides || null,
            callback        = link.callback || null,
            isVanguard      = isInternalDomain(webAnalytics.config_data),
            trackingEnabled = webAnalytics.config_data.trackingEnabled,
            doneAction      = function() {
                if (typeof callback === 'function')
                {
                    callback();
                }
                cleanup(webAnalytics);
            };

        if (isVanguard && trackingEnabled)
        {
            s.populateAAVars();
            s.tl(true, type, name, overrides, doneAction);
        }
    };

}(window.adobeAnalytics));

/**********************************************************************************
 * Update Data
 *********************************************************************************/
(function(s) {
    'use strict';
    var impl = s.implementation;

    /**
     * Update Properties
     *
     * @param data
     * @param data.country the country
     * @param data.crewFlag is the visitor a crew member
     * @param data.domain the domain
     * @param data.environment the environment
     * @param data.language the language
     * @param data.platform the platform
     * @param data.pageNotFound was 404 error page
     * @param data.reportSuiteIds ID's of reports
     * @param data.section Teamsite branch
     * @param data.siteIdentifier
     * @param data.subSection Teamsite sub-branch
     * @param data.subViewId Unique ID for a sub-view
     * @param data.pageName
     * @param data.url override URL
     * @param data.dfaMaxDelay
     * @param data.dfaEnabled
     * @param data.dfaSPOTID
     * @param data.trackingEnabled - enable/disable track calls
     * @param data.timeZoneOffset
     * @param data.dstObserved
     * @param data.resetSession
     * @param data.charSet
     * @param data.currencyCode
     * @param data.linkInternalFilters
     * @param data.prevPageName
     */
    impl.updateProperties = function(data) {
        var webAnalytics = window.webAnalytics,
            support      = s.support,
            cfd          = webAnalytics.config_data,
            ctd          = webAnalytics.context_data,
            dfa          = webAnalytics.dfa_data,
            pd           = webAnalytics.page_data,
            dc           = support.clone(data); // Clone of data object to avoid manipulating data object

        /* Config Data (20) */
        cfd.siteIdentifier = support.sanitizeString('siteIdentifier', cfd, dc);
        cfd.pageId = support.sanitizeString('pageId', cfd, dc);
        cfd.subViewId = support.sanitizeString('subViewId', cfd, dc);
        cfd.domain = support.sanitizeString('domain', cfd, dc);
        cfd.url = support.sanitizeString('url', cfd, dc);
        cfd.platform = support.sanitizeString('platform', cfd, dc, 'web');
        cfd.section = support.sanitizeString('section', cfd, dc);
        cfd.subSection = support.sanitizeString('subSection', cfd, dc);
        cfd.language = support.sanitizeString('language', cfd, dc, 'en');
        cfd.country = support.sanitizeString('country', cfd, dc, 'us');
        cfd.charSet = support.sanitizeString('charSet', cfd, dc, 'ISO-8859-1');
        cfd.currencyCode = support.sanitizeString('currencyCode', cfd, dc, 'USD');
        cfd.linkInternalFilters = support.sanitizeString('linkInternalFilters', cfd, dc, 'vanguard.com');
        cfd.environment = support.sanitizeString('environment', cfd, dc, 'dev');
        cfd.trackingEnabled = support.sanitizeBoolean('trackingEnabled', cfd, dc, true);
        cfd.pageNotFound = support.sanitizeBoolean('pageNotFound', cfd, dc);
        cfd.resetSession = support.sanitizeBoolean('resetSession', cfd, dc);
        cfd.dstObserved = support.sanitizeBoolean('dstObserved', cfd, dc, true);
        cfd.crewFlag = support.sanitizeBoolean('crewFlag', cfd, dc);
        cfd.timeZoneOffset = support.sanitizeInt('timeZoneOffset', cfd, dc, -5);
        cfd.reportSuiteIds = support.sanitizeArray('reportSuiteIds', cfd, dc, ['vanguard<siteDescriptor><environment>']);
        cfd.businessLine = support.sanitizeString('businessLine', cfd, dc);
        cfd.timeZone = support.sanitizeString('timeZone', cfd, dc);
        cfd.cookieDomainPeriods = support.sanitizeInt('cookieDomainPeriods', cfd, dc);

        /* Page Data (1) */
        pd.prevPageName = s.Util.cookieRead('s_prev_pn');
        pd.pageName = support.sanitizeString('pageName', pd, dc);

        /* DoubleClick for Advertisers Configuration (3) */
        dfa.enabled = support.sanitizeBoolean('dfaEnabled', {dfaEnabled : dfa.enabled}, dc);
        dfa.maxDelay = support.sanitizeString('dfaMaxDelay', {dfaMaxDelay : dfa.maxDelay}, dc, '750');
        dfa.SPOTID = support.sanitizeString('dfaSPOTID', {dfaSPOTID : dfa.SPOTID}, dc);

        //Sync all contextData variables to properties not assigned
        support.forEach(dc, function(value, key) {
            if (!support.isNullOrUndefined(value))
            {
                ctd[key] = value;
            }
        });
    };

    /**
     * Searches top level properties of the window.webAnalytics object to see if they
     * contain an attribute with the given name.  Once found, return its value.
     *
     * @param name the name of the property
     * @returns String the value of that property, else empty string
     */
    impl.getProperty = function(name) {
        var value        = ''; //default to empty string

        s.support.forEach(window.webAnalytics, function(property) {
            value = property[name] || value;
        });
        return value || s.support.getPropertyFromCookie(name);
    };

}(window.adobeAnalytics));

/**********************************************************************************
 * Event Listeners
 *********************************************************************************/
(function(s) {
    'use strict';

    var impl              = s.implementation,
        addEventListener  = s.support.addEventListener,
        canUsePageEvents  = window.onpageshow !== undefined && window.onpagehide !== undefined,
        loadEvent         = canUsePageEvents ? 'pageshow' : 'load',
        beforeunloadEvent = canUsePageEvents ? 'pagehide' : 'beforeunload';

    impl.beforeUnload = function() {
        s.Util.cookieWrite('s_prev_pn', s.pageName || '', 0); //previous pageName
    };

    /**
     * Use beforeunload event because IE does not trigger unload event for closing of
     * tabs.
     */
    addEventListener(window, beforeunloadEvent, impl.beforeUnload);

    impl.onLoad = function() {
        window.webAnalytics.page_data.prevPageName = s.Util.cookieRead('s_prev_pn');
    };

    addEventListener(window, loadEvent, impl.onLoad);

}(window.adobeAnalytics));

(function(s) {
    'use strict';
    var impl         = s.implementation,
        configData   = window.webAnalytics.config_data;
    impl.resetSession = function() {
        var jan_first_1970 = new Date(0);

        s.Util.cookieWrite('AMCV_vanguard', '', jan_first_1970);
        s.Util.cookieWrite('s_cc', '', jan_first_1970);
        s.Util.cookieWrite('s_pers', '', jan_first_1970);
        s.Util.cookieWrite('s_sess', '', jan_first_1970);
        configData.resetSession = true;
    };
}(window.adobeAnalytics));