/*global $, document */

(function($, adobeAnalyticsImpl) {

    var utils = {

        /**
        *  Returns the content property of a given META tag name
        *
        * @param metaTagName name attribute of meta tag
        * @returns the value of the content property of a meta tag
        */
        getMetaTagContent: function(metaTagName) {
            var metaTag = $("meta[name='" + metaTagName + "']");
            return (metaTag.length > 0) ? metaTag.first().attr("content") : '';
        },

        /**
         * Returns the environment value the code is running it.
         * Logic is based off the current window.location.host value
         */
        getCurrentEnvironment: function() {
            var host = window.location.host;
            return (host.substring(0,3) === 'www') ? 'prod' : 'staging';
        },

        getSubDomain: function() {
            var hostName = window.location.hostname.split('.'),
                subDomain;

            if (hostName[0].indexOf("www") > -1){
                hostName.splice(0, 1);
            }

            subDomain = hostName[0];
            //these conditions indicate either local development or no subdomain, in which case a blank string should be returned
            if (subDomain || subDomain.substring(0,9) === "localhost" || subDomain.substring(0,8) === "vanguard" || subDomain.substring(0,13) === "institutional"){
                subDomain = '';
            }

            return subDomain;
        }
    },

    /**
     * Returns the page section identifier to append to the page identifier on product pages
     *
     * @returns {string} page level section
     */
    getPageSection = function() {
        var pageSection = '',
            hash = decodeURIComponent(location.hash),
            index = hash.indexOf('##'),
            urlPath = window.location.href,
            productType, assetType;

        if(urlPath.indexOf('invest-with-us/uk-load-funds') > -1) { //for uk invest with us pages
            pageSection = $.urlParam('selectOption');
        } else if(urlPath.indexOf('/investment-products/') > -1) { // for uk institutional fund list pages
            if(urlPath.indexOf('/all-products') > -1) {
                pageSection = 'all-products'
            } else {
                pageSection = $.urlParam('productType');
            }
        } else if(urlPath.indexOf('/investments/all-products') > -1) {
            assetType =  $.urlParam('assetType');
            productType = $.urlParam('productType');
            pageSection = productType || 'all-products';
            if(assetType) {
                pageSection += ('-' + assetType);
            }
        } else if(index > -1) {
            hash = hash.substring(index + 2, urlPath.length).split('_');
            pageSection = hash.join('-');
        } else if($(".open-tab-red").attr("content")) { //detect active tab for about us pages
            pageSection = $(".open-tab-red").attr("content");
        } else if($(".toolsTabs-on").attr("id")) { //detect active tab for tools pages
            pageSection = $(".toolsTabs-on").attr("id");
        } else if ($(".dataTableRedBlock").attr("id")){
            pageSection = $(".dataTableRedBlock").attr("id");
        }
        return pageSection;
    },

    /**
     * Returns the value of the port ID for product detail pages
     *
     * @returns {string} portId
     */
    getPortId = function() {
        var detailData = window.detailData,
            distData = window.distData,
            portId = '';

        if(detailData) {
            if(detailData.statistics) {
                portId = detailData.statistics.fund_statistics[0].profile.portId;
            } else if(detailData.profile) {
                portId = detailData.profile.fund_profile[0].portId;
            }
        } else if(distData) {
            portId = distData.fund_distribution[0].profile.portId;
        } else {
            portId = $.urlParam('portId');
        }

        return (portId !== '') ? portId : '-';
    },

    /**
     * Update the parts of the pageName when pageId is constructed from wild cards
     *
     * @param pageSection page identifier addendum override
     */
    getPageIdentifier = function(pageSection) {
            var pageIdentifier = [],
                portId = getPortId(),
                section = pageSection || getPageSection(),
                pageName = utils.getMetaTagContent('rpt-PageName');

            if(pageName) {
                if(pageName.indexOf('<productPortId>') > -1) {
                    pageName = pageName.replace('<productPortId>', portId);
                }

                pageIdentifier.push(pageName);

                if(section) {
                    pageIdentifier.push(section);
                }
            }
            return pageIdentifier.join('-');
    },

    /**
     * Returns the value of a given cookie name
     *
     * @param name Name of cookie
     * @returns {string} value of cookie
     */
    readCookie = function(name) {
        var cookies = document.cookie.split(';'),
            index = cookies.length,
            cookie, cname, cvalue = '';

        while(index--) {
            cookie = $.trim(cookies[index]);
            cname = cookie.split('=')[0];
            if(cname === name) {
               cvalue = decodeURIComponent(cookie.split('=')[1]);
               break;
            }
        }
        return cvalue;

    },

    /**
     * Determines if the consent tracking cookies on UK or UKW site is set to TRUE
     *
     * @returns {boolean} Returns True if either UK or UKW consent cookies are set to TRUE, or not set
     */
    isCookiesAccepted = function() {
         var uk_cookie = readCookie('tracking_consent_uk'),
             ukw_cookie = readCookie('tracking_consent'),
             accepted = true;

        if(ukw_cookie && ukw_cookie !== 'YES') {
            accepted = false;
        } else if(uk_cookie && uk_cookie !== 'YES') {
            accepted = false;
        }

        return accepted;
    },

    /**
     * Update properties and send data to Adobe
     *
     * @param props object containing update properties
     * @param props object containing update properties
     */
    updateAndSendAdobeValues = function(props, pageSection) {
        var trackingAllowed = isCookiesAccepted();

        adobeAnalyticsImpl = adobeAnalyticsImpl || window.adobeAnalyticsImpl;
        props.pageId = getPageIdentifier(pageSection);

        if(adobeAnalyticsImpl && trackingAllowed) {
            adobeAnalyticsImpl.updateProperties(props);
            adobeAnalyticsImpl.track();
        }
    };

    /**
     * Read URL parameter value for a given query parameter name
     *
     * @param name name of query parameter
     * @returns {*} value of query parameter
     */
    $.urlParam = function(name){
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        return results ? (results[1] || 0) : '';
    };

    /**
     * On document.ready event, collect all page and site level values and send to Adobe's servers followed by a track call
     */
    $(document).ready(function() {

        var properties = {
                country : utils.getMetaTagContent('rpt-Country'),
                language: utils.getMetaTagContent('lang'),
                platform: 'web',
                siteIdentifier: utils.getMetaTagContent('rpt-BusinessLine'),
                environment: utils.getCurrentEnvironment(),
                reportSuiteIds: ['vanguard<siteDescriptor><environment>'],
                timeZone: 'CET',
                timeZoneOffset: 1,
                dstObserved: false,
                section: utils.getMetaTagContent('rpt-PageSection'),
                subSection: utils.getMetaTagContent('rpt-PageSubSection'),
                ///pageId: utils.getMetaTagContent('rpt-PageName'),
                domain: utils.getSubDomain(),
                currencyCode:'EUR',
                linkInternalFilters:'vanguard.ch,institutional.vanguard.ch,vanguard.com',
                pageNotFound: utils.getMetaTagContent("rpt-errorPage") === "404",
                cookieDomainPeriods: 3
        };

        updateAndSendAdobeValues(properties);
    });

    /**
     * Track vuiTab directive tabs as new page hits
     */
    $(document).on('click', '.vuiTab', function(){
        updateAndSendAdobeValues({});
    });

    /**
     * Track PDF links
     */
    $(document).on('click', "a[href*='loadImage?docId=']", function(){
        adobeAnalyticsImpl = adobeAnalyticsImpl || window.adobeAnalyticsImpl;
        if(adobeAnalyticsImpl) {
            adobeAnalyticsImpl.trackLink( { type: 'd', name: $(this).attr('href') });
        }
    });

    /**
     * Fund Compare and Cost SIM Tool
     */
    $(document).on('click', '.pageToggle', function(){
        updateAndSendAdobeValues({}, $(this).attr('id'));
    });

    /**
     * Track Sub-tabs in ETF education center
     */
    $(document).on('click', '.subtabset a', function(){
        var title = $(this).attr('href');
        title = title.substring(title.lastIndexOf('/')+1, title.length);
        updateAndSendAdobeValues({}, title);
    });

    /**
     * For investor resource - dealing information
     */
    $(document).on('click', '.ui-tabs-anchor', function(){
        var newSubTopic = $(this).attr('href').replace('#','').replace('_domiciled','-dom');
        updateAndSendAdobeValues({}, newSubTopic);
    });

    /**
     * For listview page with nav/mkt return toggle (HK) or % or $ toggle (CAW)
     */
    $(document).on('click', '.dataTableGrayBlock, .dataTableRedBlock', function(){
        var id = $(this).attr('id');
        id = id || $(this).children('a').attr('id');
        updateAndSendAdobeValues({}, id);
    });

    /**
     * For pages using leftnav (ie. research & commentary)
     */
    $(document).on('click', '.leftNav li', function(){
        var id = '';
        if (!$(this).hasClass('hasSubCategories')){
            id = $(this).children('a').attr('id');

            if (!(id === 'dropDownTop')){
                id = id.replace('-category', '');
                if ($(this).parent().siblings().hasClass('hasSubCategories')){
                    id = $(this).parent().siblings().children('a').attr('id').replace('-category', '') + id;
                }
                updateAndSendAdobeValues({}, id);
            }
        }
    });

    /**
     * For pages using traditional tabs
     *
     * the adobe request should NOT fire on tab click for traditional product pages since a new request will fire when the page loads
     * the adobe request should fire for non product pages as well as
     * institutional product pages in GAS site as these pages do not fire new page request on the tab click
     */
    $(document).on('click', '.tabs .toggle-enabled', function(){
        var detailData = window.detailData;

        if (!detailData ||  $(this).hasClass('instlFundDtlTabs')){
            updateAndSendAdobeValues({}, $(this).attr('content'));
        }
    });



}(jQuery, window.adobeAnalyticsImpl));
