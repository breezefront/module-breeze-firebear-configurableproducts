/**
 * icp.abstract
 *
 * @copyright Copyright © 2020 Firebear Studio. All rights reserved.
 * @author    Firebear Studio <fbeardev@gmail.com>
 */
define([
    'jquery',
    'ko',
    'mage/translate',
    'jqueryHistory'
], function ($, ko, $t) {
    'use strict';

    return {
        component: 'icpAbstract', // Breeze fix: added component

        /**
         *
         * @param config
         * @param simpleProductId
         * @private
         */
        _RenderDeliveryDate: function (config, simpleProductId) {
            let deliveryDateBlock = '.delivery_cpi_custom_block';
            if (config.deliveryDate) {
                let today = new Date();
                today.setHours(0);
                today.setMinutes(0);
                today.setSeconds(0);
                today.setMilliseconds(0);
                if (today.hasOwnProperty('setMicroseconds')) {
                    today.setMicroseconds(0);
                }
                let todayString = today.toString();
                today = today.valueOf();
                if ($(deliveryDateBlock).length == 0) {
                    $(config.deliveryDate.block).append('<span class="delivery_cpi_custom_block"></span>');
                }
                if (config.deliveryDate[simpleProductId]
                    && config.deliveryDate[simpleProductId].length > 0
                ) {
                    if (!config.deliveryDate[simpleProductId].startdate) {
                        let startdateT = todayString;
                    } else {
                        let startdateT = config.deliveryDate[simpleProductId].startdate;
                    }
                    if (config.deliveryDate[simpleProductId].enddate) {
                        var startdate = new Date(startdateT.replace(/(\d+)-(\d+)-(\d+)/, '$2/$3/$1')).valueOf(),
                            enddateT = $widget.options.jsonConfig.deliveryDate[simpleProductId].enddate,
                            enddate = new Date(enddateT.replace(/(\d+)-(\d+)-(\d+)/, '$2/$3/$1')).valueOf();
                        if (startdate <= today && enddate >= today) {
                            $(deliveryDateBlock).html('<br><span>' + config.deliveryDate[simpleProductId].text + '</span>');
                        }
                    }
                } else {
                    if (config.deliveryDate.parent) {
                        if (!config.deliveryDate.parent.startdate) {
                            var startdateT = todayString;
                        } else {
                            var startdateT = config.deliveryDate.parent.startdate;
                        }
                        var startdate = new Date(startdateT.replace(/(\d+)-(\d+)-(\d+)/, '$2/$3/$1')).valueOf(),
                            enddateT = config.deliveryDate.parent.enddate;
                        if (enddateT) {
                            var enddate = new Date(enddateT.replace(/(\d+)-(\d+)-(\d+)/, '$2/$3/$1')).valueOf();
                            if (startdate <= today && enddate >= today) {
                                $(deliveryDateBlock).html('<br><span>' + config.deliveryDate.parent.text + '</span>');
                            }
                        }
                    } else {
                        if ($(deliveryDateBlock).length != 0) {
                            $(deliveryDateBlock).remove();
                        }
                    }
                }
            }
        },

        /**
         *
         * @param productId
         * @param config
         * @public
         */
        _setOpenGraph: function (productId, config) {
            $.post(config.setOpenGraphUrl, {productId: productId}, function (response) {
                let property;
                $.each($(response.openGraphHtml), function () {
                    property = $(this).attr('property');
                    if (property) {
                        $('meta[property="' + property + '"]').remove();
                    }
                });
                $('head').append(response.openGraphHtml);
            });
        },

        /**
         *
         * @param config
         * @param productId
         * @public
         */
        _ReplaceHistory: function (config, productId) {
            if (typeof config.urls !== 'undefined' &&
                typeof config.urls[productId] !== 'undefined' &&
                typeof config.customAttributes[productId] !== 'undefined') {
                var url = config.urls[productId],
                    title = null;
                if (url) {
                    if (typeof config.customAttributes[productId].name !== 'undefined'
                        && typeof config.customAttributes[productId].name.value !== 'undefined'
                    ) {
                        title = config.customAttributes[productId].name.value;
                    } else if (typeof config.customAttributes[productId].name == 'undefined') {
                        if ((config.customAttributes[productId]['.breadcrumbs .items .product'])) {
                            title = config.customAttributes[productId]['.breadcrumbs .items .product'].value;
                        }
                    }
                }
                history.replaceState(null, title, url); // Breeze fix: History => history
            }
        },

        /**
         *
         * @param simpleProductId
         * @param config
         * @param $widget
         * @private
         */
        _ReplaceData: function (simpleProductId, config, $widget) {
            var self = this;
            if (!$.isNumeric(simpleProductId)) {
                simpleProductId = config.productId;
            }
            if (config.ajaxUpdate && typeof config.customAttributes[simpleProductId] == 'undefined') {
                ko.computed(function () {
                    $.ajax({
                        url: config.updateProductInfo,
                        type: 'GET',
                        dataType: 'json',
                        showLoader: true,
                        data: {
                            productId: simpleProductId,
                            parentId: config.productId
                        },
                        success: function (response) {
                            var productIds = Object.keys(response.customAttributes);
                            if (productIds.length > 0) {
                                var productId = productIds[0];
                                if (typeof config.customAttributes[productId] == 'undefined') {
                                    $.extend(config.customAttributes, response.customAttributes);
                                    $widget._ReplaceHistory(config, productId);
                                }
                            }
                            $.each(response.customAttributes[productId], function (attributeCode, data) {
                                self._parseAttrInfo(attributeCode, data);
                            });
                        }
                    });
                }, this);
            } else {
                if (typeof config.customAttributes[simpleProductId] !== 'undefined') {
                    $.each(
                        config.customAttributes[simpleProductId], function (attributeCode, data) {
                            self._parseAttrInfo(attributeCode, data);
                        }
                    );
                }
            }
            if ($.isNumeric(simpleProductId) && config.useCustomOptionsForVariations == 1) {
                this._RenderCustomOptionsBySimpleProduct(simpleProductId, config, $widget);
            }
        },

        /**
         *
         * @param {string} attributeCode
         * @param {Object} data
         * @private
         */
        _parseAttrInfo: function (attributeCode, data) {
            var $block = $(data.class);
            if (typeof data.replace != 'undefined' && data.replace) {
                if (data.value == '') {
                    $block.remove();
                }
                if ($block.length > 0 &&
                    attributeCode !== 'custom_1' &&
                    attributeCode !== 'custom_2' &&
                    attributeCode !== 'custom_3'
                ) {
                    $block.replaceWith(data.value);
                } else {
                    $(data.container).html(data.value);
                }
            } else {
                if (attributeCode == 'custom_1' || attributeCode == 'custom_2' || attributeCode == 'custom_3') {
                    if ($('.custom_block_' + attributeCode).length == 0) {
                        $block.append('<br><span class="custom_block_' + attributeCode + '"></span>');
                    }
                    var customBlock = $('.custom_block_' + attributeCode);
                    customBlock.html(data.value)
                } else if (attributeCode == 'left_in_stock') {
                    if ($('.left_in_stock').length == 0) {
                        $block.append('<p class="left_in_stock"> ' + $t('Left in stock') + ': ' + data.value + '</p>');
                    } else {
                        $('.left_in_stock').html('<p class="left_in_stock"> ' + $t('Left in stock') + ': ' + data.value + '</p>');
                    }
                } else if ($block.length > 0) {
                    $block.html(data.value);
                }
            }
        },

        /**
         *
         * @private
         */
        _loadCustomElements: function (parentElement = '.description') {
            $(parentElement).append('<p class="firebear_custom_block1"></p>')
                .append('<p class="firebear_custom_block2"></p>')
                .append('<p class="firebear_custom_block3"></p>')
                .append('<p class="firebear_custom_block4"></p>');
        },

        /**
         *
         * @param productId
         * @param config
         * @param $widget
         * @private
         */
        _RenderCustomOptionsBySimpleProduct: function (productId, config, $widget) {
            if (typeof config.customAttributes[productId] !== "undefined") {
                $.ajax({
                    url: config.loadOptionsUrl,
                    type: 'POST',
                    dataType: 'json',
                    showLoader: true,
                    data: {
                        productId: productId
                    },
                    success: function (response) {
                        if (!$('.product-options-wrapper .product-cpi-custom-options').html()) {
                            $('.product-options-wrapper').append('<div class="product-cpi-custom-options"></div>');
                            $('.product-cpi-custom-options')
                                .html('<div class="fieldset" tabindex="0">' + response.optionsHtml + '</div>')
                                .trigger('contentUpdated');
                        } else {
                            $('.product-cpi-custom-options')
                                .html('<div class="fieldset" tabindex="0">' + response.optionsHtml + '</div>')
                                .trigger('contentUpdated');
                        }
                        $('.product-cpi-custom-options').on('change', function () {
                            var customOptionsPrice = [];

                            function getSum(total, num) {
                                return total + num;
                            }

                            $('.product-cpi-custom-options .product-custom-option').each(function (key, el) {
                                var elementType = el.nodeName;
                                var elementId = parseInt(/[0-9]+/.exec(el.id));
                                switch (elementType) {
                                    case "INPUT":
                                        var inputType = $(el).attr('type');
                                        if (inputType == 'radio' || inputType == 'checkbox') {
                                            if (el.checked) {
                                                customOptionsPrice.push(parseFloat($(el).attr('price')));
                                            } else {
                                                customOptionsPrice.push(0);
                                            }
                                        } else {
                                            if (inputType == 'text' || inputType == 'file') {
                                                if (el.value) {
                                                    customOptionsPrice.push(parseFloat(response.optionsData[elementId]['price']));
                                                } else {
                                                    customOptionsPrice.push(0);
                                                }
                                            }
                                        }
                                        break;
                                    case "SELECT":
                                        if (el.multiple) {
                                            $(el).find(":selected").each(function (index, selected) {
                                                customOptionsPrice.push(parseFloat($(selected).attr('price')));
                                            });
                                            break;
                                        } else {
                                            var singleSelectPrice = $(el).find(":selected").attr('price');
                                            if (typeof (singleSelectPrice) !== 'undefined') {
                                                customOptionsPrice.push(parseFloat(singleSelectPrice));
                                            }
                                            break;
                                        }
                                    case "TEXTAREA":
                                        if (el.value) {
                                            customOptionsPrice.push(parseFloat(response.optionsData[elementId]['price']));
                                        } else {
                                            customOptionsPrice.push(0);
                                        }
                                }
                            });
                            $('.field.date').each(function () {
                                var allDateValues = [];
                                $(this).find("select").each(function (key, el) {
                                    allDateValues.push(el.value);
                                });
                                var elementId = parseInt(/[0-9]+/.exec($(this).find("select")[0]['id']));
                                var checkOptionValues = allDateValues.every(function (element, index, array) {
                                    return element !== "";
                                });
                                if (!checkOptionValues) {
                                    customOptionsPrice.push(parseFloat(0));
                                } else if (typeof response.optionsData[elementId] !== 'undefined') {
                                    customOptionsPrice.push(parseFloat(response.optionsData[elementId]['price']));
                                }
                            });
                            if (customOptionsPrice.length > 0) {
                                $widget['customOptionsPrice'] = customOptionsPrice.reduce(getSum);
                                $widget.updateProductPrice();
                                delete $widget['customOptionsPrice'];
                            }
                        });
                    }
                });
            }
        },
    };
});
