/**
 * configurable-mixin
 *
 * @copyright Copyright © 2020 Firebear Studio. All rights reserved.
 * @author    Firebear Studio <fbeardev@gmail.com>
 */
define([
    'jquery',
    'icpAbstract',
    'ko',
    'priceBox',
    'jqueryHistory',
    'domReady!'
], function ($, icpAbstract, ko) {
    'use strict';

    var icpMixin = {
        options: {
            priceHolderSelector: '.price-box',
            spConfig: {},
        },

        /**
         * Initialize tax configuration, initial settings, and options values.
         * @returns {*}
         * @private
         */
        _initializeOptions: function (original) {
            let element;
            element = $(this.options.priceHolderSelector);

            _.each(element, function (e) {
                let priceElement = $(e);

                if (!priceElement.data('priceBox')) {
                    priceElement.priceBox();
                }
            });

            return original(); // Breeze fix: this._super() => original()
        },

        /**
         *
         * @private
         */
        _loadCustomElements: function () {
            icpAbstract._loadCustomElements();
        },

        /**
         *
         * @param config
         * @param productId
         * @private
         */
        _ReplaceHistory: function (config, productId) {
            icpAbstract._ReplaceHistory(config, productId);
        },

        /**
         *
         * @param productId
         * @param config
         * @private
         */
        _ReplaceData: function (productId, config) {
            icpAbstract._ReplaceData(productId, config, this);
        },

        /**
         * Returns prices for configured products
         *
         * @param {*} config - Products configuration
         * @returns {*}
         * @private
         */
        _calculatePrice: function (original, config) {
            if (typeof (this.customOptionsPrice) !== 'undefined') {
                var displayPrices = $(this.options.priceHolderSelector).priceBox('option').prices,
                    newPrices = this.options.spConfig.optionPrices[_.first(config.allowedProducts)],
                    customOptionsPrice = 0;
                if (typeof (this.customOptionsPrice) !== 'undefined') {
                    customOptionsPrice = this.customOptionsPrice;
                }
                if (typeof newPrices !== 'undefined') {
                    _.each(
                        displayPrices, function (price, code) {
                            if (typeof newPrices !== 'undefined' && typeof newPrices[code] !== 'undefined') {
                                displayPrices[code].amount =
                                    newPrices[code].amount - displayPrices[code].amount + customOptionsPrice;
                            }
                        }
                    );
                }
                return displayPrices;
            } else {
                return original(config); // Breeze fix: this._super() => original()
            }
        },

        /**
         * Update product price
         */
        updateProductPrice: function() {
            this._reloadPrice();
        },

        /**
         *
         * @param config
         * @param simpleProductId
         * @private
         */
        _RenderDeliveryDate: function (config, simpleProductId) {
            icpAbstract._RenderDeliveryDate(config, simpleProductId);
        },

        /**
         *
         * @param productId
         * @param config
         * @private
         */
        _setOpenGraph: function (productId, config) {
            icpAbstract._setOpenGraph(productId, config);
        },

        /**
         *
         * @param context
         * @private
         */
        _updateICPContent: function (context) {
            if (context) {
                var config = context.options.spConfig;
                var productId = 'parent';
                if ('undefined' !== typeof context.simpleProduct) {
                    productId = context.simpleProduct;
                    if (!productId || !$.isNumeric(productId)) {
                        productId = 'parent';
                    }
                }
                /**
                 * Change product attributes.
                 */
                context._ReplaceData(productId, config);
                context._ReplaceHistory(config, productId);
                context._setOpenGraph(productId, config);
                context._RenderDeliveryDate(config, productId);
            }
        },

        /**
         *
         * @private
         */
        _icpChange: function () {
            var context = this;
            this._loadCustomElements();
            $.each(this.options.settings, $.proxy(function (index, element) {
                $(element).on('change', $.proxy(function () {
                    (function (context) {
                        context._updateICPContent(context);
                    })(this);
                }, this));
            }, context));
        },

        /**
         * Set up .on('change') events for each option element to configure the option.
         * @private
         */
        _setupChangeEvents: function (original) {
            original(); // Breeze fix: this._super() => original()
            this._icpChange();
        },

        /**
         *
         * @private
         */
        _configureForValues: function (original) {
            original(); // Breeze fix: this._super() => original()
            this._updateICPContent(this);
        }
    };

    $.mixin('configurable', icpMixin); // Breeze fix: apply mixin
});
