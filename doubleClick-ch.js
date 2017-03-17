(function(doubleClickObj, $, undefined) {
	
	doubleClickObj.updateDoubleClickTagSrc = function(){
		var $theDoubleClickIFrame = $("#doubleClickFloodlightTag");
		var type = $("meta[name='doubleclick-type']").attr("content");
		var cat = $("meta[name='doubleclick-cat']").attr("content");
		var pagename = $("meta[name='rpt-PageName']").attr("content");
		var country = $("meta[name='rpt-Country']").attr("content");
		var topNav = $("meta[name='topnav']").attr("content");
		var subnav = $("meta[name='subnav']").attr("content");
		
		var ord = Math.floor((Math.random() * 10000000000000) + 1); //random number - to prevent caching of request
		var completeSrcString ="";
		var doubleClickGlobalTags = {};
		doubleClickGlobalTags.typeValue  				= 	"switz0"; 
		doubleClickGlobalTags.catValue   				= 	"switz0"; 
		var doubleClickCustomTags = {};
		doubleClickCustomTags.insightsSectionLinks 		=	"switz002";  
		doubleClickCustomTags.insightsSectionPDFs 		=   "switz003"; 
		// About our product
		doubleClickCustomTags.aboutOurProductTabs		=   "switz005"; 
		// Detail Page 
		doubleClickCustomTags.detailPagePDFs			=   "switz000";
		doubleClickCustomTags.detailPageMainTabs		=   "switz004";
		doubleClickCustomTags.detailPageLinks			=   "switz00"; 
		// Product List
		doubleClickCustomTags.productPage				=   "switz007";  
		doubleClickCustomTags.productPagePDFs			=   "switz006";  
		doubleClickCustomTags.productPageDropDownMenu	=   "switz007";
		// campaigns tags 
		doubleClickCustomTags.fixedIncomePage 			=	"switz008";
		doubleClickCustomTags.fixedIncomePagePDFs 		=	"switz009";
		doubleClickCustomTags.fixedIncomePageFundListLinks ="switz00a";
		doubleClickCustomTags.fixedIncomePageEmail 		=	"switz00b";
		
		if (($theDoubleClickIFrame.length > 0) && (typeof(type) != 'undefined') 
				&& (typeof(cat) != 'undefined') && (typeof(pagename) != 'undefined') && (typeof(country) != 'undefined') ){
			var src = $theDoubleClickIFrame.attr("name"); //src (each site has unique id) that is stored in the name attribute of the iframe
			pagename = getPageName(pagename); //page name - using same meta tag as Adobe Analytics
			type = getDynamicValue(type);
			cat = getDynamicValue(cat);
			if( (type == "") && (cat == "") ){
				type = doubleClickGlobalTags.typeValue; 
				cat  = doubleClickGlobalTags.catValue; 
			}

			if(pagename==="fixed-income-campaign"){ // fixed Income Page
				completeSrcString = constructDoubleClickURL(src,type,doubleClickCustomTags.fixedIncomePage,ord);
				$theDoubleClickIFrame.attr("src", completeSrcString);
			}else{
			completeSrcString = constructDoubleClickURL(src,type,cat,ord);
			$theDoubleClickIFrame.attr("src", completeSrcString);
			}
	
	
		// Drop down Menu 
		$(document).on("click",".vuiMenu .vuiMenuitem",function(event){
			if((topNav==="investments") && (subnav==="all-products")){ // Product Page Menu Clicks 
				completeSrcString = constructDoubleClickURL(src,type,doubleClickCustomTags.productPageDropDownMenu,ord);
				$theDoubleClickIFrame.attr("src", completeSrcString);
				}
		});
		
		$(document).on("click","span.linkIcon",function(event){
			if((topNav==="investments") && (subnav==="all-products")){ // Product Page PDFs Clicks 
				completeSrcString = constructDoubleClickURL(src,type,doubleClickCustomTags.productPagePDFs,ord);
				$theDoubleClickIFrame.attr("src", completeSrcString);
				}
		});
		
		// Links , Pdfs , Images 
		$(document).on("click",".gridContainer a,img",function(event){
			if(topNav === "insights"){								// Insights sections links and PDF  Clicks 
				if(isPDF($(this).html())){
					completeSrcString = constructDoubleClickURL(src,type,doubleClickCustomTags.insightsSectionPDFs,ord);
				}else{
					completeSrcString = constructDoubleClickURL(src,type,doubleClickCustomTags.insightsSectionLinks,ord);
				}
				$theDoubleClickIFrame.attr("src", completeSrcString);
			}else if((topNav==="investments") && (subnav==="etf")){ // Detail page links and PDFs  Clicks 
				if(isPDF($(this).html())){
					completeSrcString = constructDoubleClickURL(src,type,doubleClickCustomTags.detailPagePDFs,ord);
				}else{
					var attr = $(this).attr("id");
					if ((typeof(attr) != 'undefined') && (attr.indexOf("tab") >= 0)){
						completeSrcString = constructDoubleClickURL(src,type,doubleClickCustomTags.detailPageMainTabs,ord);
					}else{
						completeSrcString = constructDoubleClickURL(src,type,doubleClickCustomTags.detailPageLinks,ord);	
					}
				}
				$theDoubleClickIFrame.attr("src", completeSrcString);
			}else if(pagename==="fixed-income-campaign"){ // fixed Income page PDFs & Email address
				var hrefValue = $(this).attr('href');
				if((typeof(hrefValue) != 'undefined') && (hrefValue.indexOf(".pdf") >= 0)){
					completeSrcString = constructDoubleClickURL(src,type,doubleClickCustomTags.fixedIncomePagePDFs,ord);
					$theDoubleClickIFrame.attr("src", completeSrcString);
				}else if((typeof(hrefValue) != 'undefined') && (hrefValue.indexOf("mailto:") >= 0)){
					completeSrcString = constructDoubleClickURL(src,type,doubleClickCustomTags.fixedIncomePageEmail,ord);
					$theDoubleClickIFrame.attr("src", completeSrcString);
				}else{
					completeSrcString = constructDoubleClickURL(src,type,doubleClickCustomTags.fixedIncomePageFundListLinks,ord);
					$theDoubleClickIFrame.attr("src", completeSrcString);
				}
			}
		});
		
		// Insights sections - global pension page tabs 
		$(document).on("click",".tabs .open-tab-grey",function(event){
			if(topNav === "insights"){								// Insights sections links and PDF  Clicks 
				completeSrcString = constructDoubleClickURL(src,type,doubleClickCustomTags.insightsSectionLinks,ord);
				$theDoubleClickIFrame.attr("src", completeSrcString);
			}
		});
		
		// About our product tabs 
		$(document).on("click",".tabs div.toggle-enabled",function(event){
			if (pagename === "about-our-products"){
				completeSrcString = constructDoubleClickURL(src,type,doubleClickCustomTags.aboutOurProductTabs,ord);
				$theDoubleClickIFrame.attr("src", completeSrcString);
			}		
		});
		
		// Fixed Income list 
		$(document).on("click",".linkList a",function(event){
			if ((pagename==="fixed-income-campaign") && ($(this).attr('href').indexOf("/all-products") >= 0) ){
				completeSrcString = constructDoubleClickURL(src,type,doubleClickCustomTags.fixedIncomePageFundListLinks,ord);
				$theDoubleClickIFrame.attr("src", completeSrcString);}		
		});
		
		}
	  }
	// construct DoubleClick URL  
	function constructDoubleClickURL(srcValue, typeValue, catValue, ordValue) {
		 var doubleCickURL = "https://" + srcValue + ".fls.doubleclick.net/activityi" 
									+ ";src=" + srcValue
									+ ";type=" + typeValue 
									+ ";cat=" + catValue 
									+ ";dc_lat=" + ""
									+ ";dc_rdid=" + "" 
									+ ";tag_for_child_directed_treatment=" + ""
									+ ";ord=" + ordValue + "?";
		return doubleCickURL;
	}
	// Check if the str contains pdf or not 
	function isPDF(str){
				if ( (str.indexOf("linkIcon") >= 0) || (str.indexOf(".pdf") >= 0) ){
				return true;}
		return false; 
	}
	// cancel ajax previous call 
	function cancelPrevRequest(str){
		 str = str.abort();
		return str;  
	}
	// for pages using shared property files the cat and type values must be determined dynamically based on context path
	var getDynamicValue = function(value){
		if(value.indexOf("<shared:") > -1){
			var values = value.replace("<shared:", "");
			values = values.replace(">", "");
			valuesArray = values.split(",");
			var filteredValue;
			for(var i = 0,l = valuesArray.length; i<l;i++)
				{
				 if(valuesArray[i].indexOf(gbs.contextPath) > -1){
					 filteredValue = valuesArray[i];
				 }
				}
			return filteredValue.substring(filteredValue.indexOf("_")+1);
		} else {
			return value;
		}
	}
	
	//swap in the port ID if the page name contains a port ID placeholder
	var getPageName = function(pageName){
		if ((typeof(pageName) != 'undefined') && (pageName != "")){
			if (pageName.indexOf("<productPortId>") > -1){
				//return the port ID (which can be stored in multiple places depending on the selected detail tab)
				if (typeof(detailData) != "undefined" && detailData && detailData.statistics){
					return detailData.statistics.fund_statistics[0].profile.portId;
				} 
				else if (typeof(detailData) != "undefined" && detailData && detailData.profile){
					return detailData.profile.fund_profile[0].portId;
				}
				else if (typeof(distData) != "undefined" && distData){
					return distData.fund_distribution[0].profile.portId;
				}
				else {
					return "-";
				}
			} else {
				return pageName;
			}
		} else {
			return ""
		}
	}
	
}(window.doubleClickObj = window.doubleClickObj || {}, jQuery));

$(document).ready(function(){
	doubleClickObj.updateDoubleClickTagSrc();
});