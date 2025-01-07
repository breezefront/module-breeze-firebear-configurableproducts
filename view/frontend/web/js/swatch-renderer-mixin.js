/**
 * swatch-renderer-mixin
 *
 * @copyright Copyright © 2020 Firebear Studio. All rights reserved.
 * @author    Firebear Studio <fbeardev@gmail.com>
 */
define([
    'jquery',
    'underscore',
    'mage/template',
    'mage/translate',
    'Magento_Catalog/js/price-utils',
    'icpAbstract',
    'priceBox',
    'jqueryHistory',
    'domReady!'
], function ($, _, mageTemplate, $t, priceUtils, icpAbstract) {
    'use strict';

    /* jQuery load event */
    $(document).on('breeze:load', function () { // Breeze fix: $(document).ready => $(document).on('breeze:load')
        localStorage.setItem('processed', '');
    });

    /**
     *
     */
    var icpSwatchMixin = {
        options: {
            renderSwatchOptionConfig: {
                attributeCode: 'attribute-code',
                attributeId: 'attribute-id',
                optionType: 'option-type',
                optionId: 'option-id',
                optionLabel: 'option-label',
                optionEmpty: 'option-empty',
                optionSelected: 'option-selected',
                optionTooltipThumb: 'option-tooltip-thumb',
                optionTooltipValue: 'option-tooltip-value'
            },

            productClasses: {
                itemInfo: '.product-item-info',
                itemLink: '.product-item-link',
                itemPhoto: '.product-item-photo',
            }
        },

        /**
         * Initialize tax configuration, initial settings, and options values.
         * @returns {*}
         * @private
         */
        _init: function () {
            let element,
                $widget = this;
            element = $(this.options.selectorProductPrice);

            _.each(element, function (e) {
                let priceElement = $(e);

                if (!priceElement.data('priceBox')) {
                    priceElement.priceBox();
                }
            });

            if (this.options.jsonConfig.is_mage_24) {
                this.options.renderSwatchOptionConfig.attributeCode = this.options.jsonConfig.attribute_prefix + 'attribute-code';
                this.options.renderSwatchOptionConfig.attributeId = this.options.jsonConfig.attribute_prefix + 'attribute-id';

                this.options.renderSwatchOptionConfig.optionType = this.options.jsonConfig.attribute_prefix + 'option-type';
                this.options.renderSwatchOptionConfig.optionId = this.options.jsonConfig.attribute_prefix + 'option-id';
                this.options.renderSwatchOptionConfig.optionLabel = this.options.jsonConfig.attribute_prefix + 'option-label';
                this.options.renderSwatchOptionConfig.optionEmpty = this.options.jsonConfig.attribute_prefix + 'option-empty';
                this.options.renderSwatchOptionConfig.optionSelected = this.options.jsonConfig.attribute_prefix + 'option-selected';

                this.options.renderSwatchOptionConfig.optionTooltipThumb = this.options.jsonConfig.attribute_prefix + 'option-tooltip-thumb';
                this.options.renderSwatchOptionConfig.optionTooltipValue = this.options.jsonConfig.attribute_prefix + 'option-tooltip-value';
            }
            this._super();
            if (!$widget.inProductList) {
                $widget.inProductList = $widget.options.jsonConfig.fbInProductList;
            }
            return this;
        },

        _create: function () {
            this._super();
            if (!this.inProductList) {
                this.inProductList = this.options.jsonConfig.fbInProductList;
            }
        },

        /**
         * Get default options values settings with either URL query parameters
         * @private
         */
        _getSelectedAttributes: function () {

            if (!_.isEmpty(this.options.jsonConfig.defaultValues)) { // Breeze fix:
                return this.options.jsonConfig.defaultValues;
            }
            return this._super();
        },

        /**
         * Render controls
         *
         * @private
         */
        _RenderControls: function () {
            icpAbstract._loadCustomElements();
            this._super();
        },

        /**
         *
         * @param selectedAttributes
         * @private
         */
        _EmulateSelected: function (selectedAttributes) {
            let $widget = this,
                countSelectedAttributes = Object.keys(selectedAttributes).length,
                attributeNumber = 1;

            /**
             * Check if url_key for child product is available and then select the selected config's of the product
             */
            if ($widget.options.jsonConfig.icpsettings.change_url
                && typeof _.invert($widget.options.jsonConfig.urls)[window.location.href] !== undefined
            ) {
                let simpleProductId = _.invert($widget.options.jsonConfig.urls)[window.location.href];
                if ($.isNumeric(simpleProductId) && countSelectedAttributes <= 0) {
                    selectedAttributes = $widget.options.jsonConfig.index[simpleProductId];
                    countSelectedAttributes = Object.keys(selectedAttributes).length;
                }
            }

            $.each(selectedAttributes, $.proxy(function (attributeCode, optionId) {
                var elem = this.element.find('.' + this.options.classes.attributeClass +
                    '[' + $widget.options.renderSwatchOptionConfig.attributeCode + '="' + attributeCode + '"] [' + $widget.options.renderSwatchOptionConfig.optionId + '="' + optionId + '"]');
                /*some websites use attribute-id instead of attribute-code*/
                if (elem.length === 0) {
                    elem = this.element.find('.' + this.options.classes.attributeClass +
                        '[' + $widget.options.renderSwatchOptionConfig.attributeId + '="' + attributeCode + '"] [' + $widget.options.renderSwatchOptionConfig.optionId + '="' + optionId + '"]');
                }
                var parentInput = elem.parent();

                if (elem.hasClass('selected')) {
                    if (attributeNumber === countSelectedAttributes) {
                        $widget['update_price'] = true;
                    } else {
                        attributeNumber++;
                    }
                    return;
                }
                $widget['update_price'] = !(attributeNumber !== countSelectedAttributes && attributeCode !== "");
                /*if swatch select option, use trigger change instead of click*/
                if (parentInput.hasClass(this.options.classes.selectClass)) {
                    parentInput.val(optionId);
                    parentInput.trigger('change');
                } else {
                    elem.trigger('click');
                }
                attributeNumber++;
            }, this));
        },

        /**
         * Change product attributes.
         * @param {Number} simpleProductId
         * @param {Object} $widget
         * @private
         */
        _ReplaceData: function (simpleProductId, $widget) {
            icpAbstract._ReplaceData(simpleProductId, $widget.options.jsonConfig, $widget);
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
         * Change parent product attributes.
         * @param {Object} $widget
         * @private
         */
        _ReplaceDataParent: function ($widget) {
            if ($widget.options.jsonConfig.icpsettings.change_url == 1
                && $widget.options.jsonConfig.parentProductName
            ) {
                var parentProductName = $widget.options.jsonConfig.parentProductName;
                history.replaceState(null, parentProductName, $widget.options.jsonConfig.urls['parent']); // Breeze fix: History => history
            }
            if (typeof $widget.options.jsonConfig.customAttributes.parent !== 'undefined') {
                $.each($widget.options.jsonConfig.customAttributes.parent, function (attributeCode, data) {
                    var $block = $(data.class);

                    if (typeof data.replace != 'undefined' && data.replace) {
                        if (data.value == '') {
                            $block.remove();
                        }

                        if ($block.length > 0) {
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
                        } else if ($block.length > 0) {
                            $block.html(data.value);
                        }
                    }
                });
            }
        },

        /**
         * Update [gallery-placeholder] or [product-image-photo]
         * @param {Array} images
         * @param {jQuery} context
         * @param {Boolean} isInProductView
         */
        // updateBaseImage: function (images, context, isInProductView) {
        //     var justAnImage = images[0],
        //         initialImages = this.options.mediaGalleryInitial,
        //         imagesToUpdate,
        //         imageObj = this,
        //         isInitial;

        //     if (isInProductView) {
        //         imagesToUpdate = images.length ? this._setImageType($.extend(true, [], images)) : [];
        //         isInitial = _.isEqual(imagesToUpdate, initialImages);
        //         var interval = window.setInterval(function () {
        //             imagesToUpdate = images.length ? imageObj._setImageType($.extend(true, [], images)) : [];
        //             isInitial = _.isEqual(imagesToUpdate, initialImages);
        //             var gallery = context.find(imageObj.options.mediaGallerySelector).data('gallery');
        //             if (gallery) {
        //                 gallery.updateData(imagesToUpdate);
        //                 // if (isInitial) {
        //                 //     $(imageObj.options.mediaGallerySelector).AddFotoramaVideoEvents(); // Breeze fix: commented AddFotoramaVideoEvents calls
        //                 // } else {
        //                 //     $(imageObj.options.mediaGallerySelector).AddFotoramaVideoEvents({
        //                 //         selectedOption: imageObj.getProduct(),
        //                 //         dataMergeStrategy: imageObj.options.gallerySwitchStrategy
        //                 //     });
        //                 // }
        //                 clearInterval(interval);
        //                 gallery.first();
        //             }
        //         }, 200);
        //     } else if (justAnImage && justAnImage.img) {
        //         context.find('.product-image-photo').attr('src', justAnImage.img);
        //     }
        // },

        /**
         * Event for swatch options
         *
         * @param {Object} $this
         * @param {Object} $widget
         * @private
         */
        _OnClick: function ($this, $widget) {
            /* Fix issue cannot add product to cart */
            var $parent = $this.parents('.' + $widget.options.classes.attributeClass),
                $wrapper = $this.parents('.' + $widget.options.classes.attributeOptionsWrapper),
                $label = $parent.find('.' + $widget.options.classes.attributeSelectedOptionLabelClass),
                attributeId = $parent.attr($widget.options.renderSwatchOptionConfig.attributeId),
                updatePrice = true,
                $input = $parent.find('.' + $widget.options.classes.attributeInput),
                checkAdditionalData = false;
            if (!_.isUndefined(this.options.jsonSwatchConfig[attributeId]['additional_data'])) {
                checkAdditionalData = JSON.parse(this.options.jsonSwatchConfig[attributeId]['additional_data']);
            }
            if ($widget.inProductList) {
                $input = $widget.productForm.find(
                    '.' + $widget.options.classes.attributeInput + '[name="super_attribute[' + attributeId + ']"]'
                );
            }

            if ($this.hasClass('disabled')) {
                return;
            }

            if (typeof ($widget.update_price) !== 'undefined') {
                updatePrice = $widget.update_price;
            }

            if ($this.hasClass('selected')) {
                if (typeof $widget.options.jsonConfig.allow_deselect_swatch == 'undefined')
                    return;
                $parent.removeAttr($widget.options.renderSwatchOptionConfig.optionSelected).find('.selected').removeClass('selected');
                $input.val('');
                $label.text('');
                $this.attr('aria-checked', false);
            } else {
                $parent.attr($widget.options.renderSwatchOptionConfig.optionSelected, $this.attr($widget.options.renderSwatchOptionConfig.optionId)).find('.selected').removeClass('selected');
                $label.text($this.attr($widget.options.renderSwatchOptionConfig.optionLabel));
                $input.val($this.attr($widget.options.renderSwatchOptionConfig.optionId));
                $input.attr('data-attr-name', this._getAttributeCodeById(attributeId));
                $this.addClass('selected');
                if (typeof $widget._toggleCheckedAttributes !== "undefined") {
                    $widget._toggleCheckedAttributes($this, $wrapper);
                }
            }
            /**
             * Get simpleProduct Id by simple product URL
             */
            var currentURL = window.location.href;
            var simpleProductId = '';
            if (!localStorage.getItem('processed')) {
                var selectedOptionId = '', selectedLabel = '';
                if (typeof this.options.jsonConfig.urls !== 'undefined') {
                    $.each(this.options.jsonConfig.urls, function (productId, productUrl) {
                        if (productUrl == currentURL) {
                            simpleProductId = productId;
                            return true;
                        }
                    });
                }
                if (simpleProductId) {
                    $.each(this.options.jsonConfig.attributes, function () {
                        var item = this;
                        var allOptions = item.options;
                        $.each(allOptions, function (key, optionObj) {
                            var products = optionObj.products;
                            for (var i = 0; i < products.length; i++) {
                                var childProductId = optionObj.products[i];
                                if (simpleProductId === childProductId) {
                                    selectedOptionId = optionObj.id;
                                    selectedLabel = optionObj.label;
                                    var select = $('div[' + $widget.options.renderSwatchOptionConfig.attributeId + '="' + item.id + '"]').find('select');
                                    if (select.find('option').length > 0) {
                                        select.val(selectedOptionId).trigger('change');
                                    } else {
                                        var parent = $('div[' + $widget.options.renderSwatchOptionConfig.attributeId + '="' + item.id + '"]'),
                                            label = parent.find('.' + $widget.options.classes.attributeSelectedOptionLabelClass),
                                            input = parent.find('.' + $widget.options.classes.attributeInput);
                                        parent.removeAttr($widget.options.renderSwatchOptionConfig.optionSelected).find('.selected').removeClass('selected');
                                        parent.attr($widget.options.renderSwatchOptionConfig.optionSelected, selectedOptionId);
                                        label.text(selectedLabel);
                                        $('input[name="super_attribute[' + item.id + ']"]').val(selectedOptionId);
                                        if (attributeId == item.id) {
                                            $('.swatch-option[' + $widget.options.renderSwatchOptionConfig.optionId + '=' + selectedOptionId + ']').addClass('selected');
                                        }
                                    }
                                }
                            }
                        });
                    });
                }
            }

            $widget._Rebuild();
            if (typeof ($widget.customOptionsPrice) !== 'undefined') {
                delete $widget.customOptionsPrice;
            }

            if ($widget.inProductList) {
                try {
                    $widget._UpdatePriceCategory();
                } catch (e) {
                    console.log(e);
                }
                try {
                    $widget._updateLink();
                } catch (e) {
                    console.log(e);
                }
                try {
                    $widget._loadMedia();
                } catch (e) {
                    console.log(e);
                }
                try {
                    $widget._updateName();
                } catch (e) {
                    console.log(e);
                }
                return;
            } else if ($widget.element.parents($widget.options.selectorProduct)
                .find(this.options.selectorProductPrice).is(':data(mage-priceBox)')
            ) {
                if (updatePrice) {
                    $widget._UpdatePrice();
                }
            }

            /**
             * Update product data & url.
             * @author Firebear Studio <fbeardev@gmail.com>
             */
            var products = $widget._CalcProducts();
            if (products.length == 0) {
                var options = {};
                $widget.element.find('.' + $widget.options.classes.attributeClass + '[' + $widget.options.renderSwatchOptionConfig.optionSelected + ']').each(function () {
                    var attributeId = $(this).attr($widget.options.renderSwatchOptionConfig.attributeId);
                    options[attributeId] = $(this).attr($widget.options.renderSwatchOptionConfig.optionSelected);
                });
                var result = _.findKey($widget.options.jsonConfig.index, options);
                products = [result];
            }
            this._ChangeFromToPrice(attributeId, $this.val(), $widget);
            var numberOfSelectedOptions = $widget.element.find('.' + $widget.options.classes.attributeClass + '[' + $widget.options.renderSwatchOptionConfig.optionSelected + ']').length;
            /**
             * Do not replace data on category view page.
             * @see \Firebear\ConfigurableProducts\Plugin\Block\ConfigurableProduct\Product\View\Type::afterGetJsonConfig()
             */
            if (products.length == 1 && !this.options.jsonConfig.doNotReplaceData && numberOfSelectedOptions) {
                if (!simpleProductId || !$.isNumeric(simpleProductId)) {
                    var simpleProductId = products[0];
                }
                try {
                    this._setOpenGraph(simpleProductId, $widget);
                } catch (e) {
                    console.exception(e);
                }
                if ($.isNumeric(simpleProductId) && $widget.options.jsonConfig.useCustomOptionsForVariations == 1) {
                    this._RenderCustomOptionsBySimpleProduct(simpleProductId, $widget);
                }
                /**
                 * Change product attributes.
                 */
                $widget._ReplaceData(simpleProductId, this);
                /* Update input type hidden - fix base image doesn't change when choose option */
                // if (simpleProductId && document.getElementsByName('product').length) {
                // document.getElementsByName('product')[0].value = simpleProductId;
                // }
                /**/
                $widget._ReplaceHistory($widget.options.jsonConfig, simpleProductId);
            } else if (!$widget.inProductList) {
                var configurableProductId = this.options.jsonConfig.productId;
                if (configurableProductId) {
                    this._setOpenGraph(configurableProductId, $widget);
                }
                if ($widget.element.parents($widget.options.selectorProduct)
                    .find(this.options.selectorProductPrice).is(':data(mage-priceBox)')
                ) {
                    $widget._ReplaceDataParent(this);
                    // document.getElementsByName('product')[0].value = simpleProductId;
                }
                $('.left_in_stock').remove();
            }
            $widget._loadMedia();
            $input.trigger('change');
            localStorage.setItem('processed', true);
        },

        /**
         * Event for select
         *
         * @param {Object} $this
         * @param {Object} $widget
         * @private
         */
        _OnChange: function ($this, $widget) {
            /* Fix issue cannot add product to cart */
            var $parent = $this.parents('.' + $widget.options.classes.attributeClass),
                attributeId = $parent.attr($widget.options.renderSwatchOptionConfig.attributeId),
                updatePrice = true,
                $input = $parent.find('.' + $widget.options.classes.attributeInput);
            if ($widget.productForm.length > 0) {
                $input = $widget.productForm.find(
                    '.' + $widget.options.classes.attributeInput + '[name="super_attribute[' + attributeId + ']"]'
                );
            }
            /**/

            if (typeof ($widget.update_price) !== 'undefined') {
                updatePrice = $widget.update_price;
            }
            if ($this.val() > 0) {
                $parent.attr($widget.options.renderSwatchOptionConfig.optionSelected, $this.val());
                $input.val($this.val());
            } else {
                $parent.removeAttr($widget.options.renderSwatchOptionConfig.optionSelected);
                $input.val('');
            }
            if (typeof ($widget.customOptionsPrice) !== 'undefined') {
                delete $widget.customOptionsPrice;
            }

            $widget._Rebuild();
            if (updatePrice) {
                $widget._UpdatePrice();
            }

            /**
             * Update product data & url.
             * @author Firebear Studio <fbeardev@gmail.com>
             */
            var products = $widget._CalcProducts();
            var options = {};
            if (products.length == 0) {
                $widget.element.find('.' + $widget.options.classes.attributeClass + '[' + $widget.options.renderSwatchOptionConfig.optionSelected + ']').each(function () {
                    var attributeId = $(this).attr($widget.options.renderSwatchOptionConfig.attributeId);

                    options[attributeId] = $(this).attr($widget.options.renderSwatchOptionConfig.optionSelected);
                });

                var result = _.findKey($widget.options.jsonConfig.index, options);
                products = [result];
            }
            /**
             * Change From Price for normal swatch
             */
            this._ChangeFromToPrice(attributeId, $this.val(), $widget);
            var numberOfSelectedOptions = $widget.element.find('.' + $widget.options.classes.attributeClass + '[' + $widget.options.renderSwatchOptionConfig.optionSelected + ']').length;
            /**
             * Do not replace data on category view page.
             * @see \Firebear\ConfigurableProducts\Plugin\Block\ConfigurableProduct\Product\View\Type::afterGetJsonConfig()
             */
            if (products.length == 1 && !this.options.jsonConfig.doNotReplaceData && numberOfSelectedOptions) {
                var simpleProductId = products[0];
                if ($.isNumeric(simpleProductId) && $widget.options.jsonConfig.useCustomOptionsForVariations == 1) {
                    this._RenderCustomOptionsBySimpleProduct(simpleProductId, $widget);
                }
                /**
                 * Change product attributes.
                 */
                $widget._ReplaceData(simpleProductId, this);
                /**
                 * Update input type hidden - fix base image doesn't change when choose option
                 */
                // if (simpleProductId && document.getElementsByName('product').length) {
                // document.getElementsByName('product')[0].value = simpleProductId;
                // }
                $widget._ReplaceHistory($widget.options.jsonConfig, simpleProductId);
            } else if (!$widget.inProductList) {
                var configurableProductId = this.options.jsonConfig.productId;
                if (configurableProductId) {
                    this._setOpenGraph(configurableProductId, $widget);
                }
                if (!$widget.element.parents($widget.options.selectorProduct)
                    .find(this.options.selectorProductPrice).is(':data(mage-priceBox)')
                ) {
                    $widget._ReplaceDataParent(this);
                    document.getElementsByName('product')[0].value = '';
                }
            }
            $widget._loadMedia();
            $input.trigger('change');
        },

        /**
         * Update product price
         */
        updateProductPrice: function() {
            this._UpdatePrice();
        },

        /**
         * Get human readable attribute code (eg. size, color) by it ID from configuration
         *
         * @param {Number} attributeId
         * @returns {*}
         * @private
         */
        _getAttributeCodeById: function (attributeId) {
            var attribute = this.options.jsonConfig.attributes[attributeId];

            return attribute ? attribute.code : attributeId;
        },

        /**
         * Update total price in category
         *
         * @private
         */
        _UpdatePriceCategory: function () {
            var $widget = this,
                $product = $widget.element.parents($widget.options.selectorProduct),
                $productPrice = $product.find(this.options.selectorProductPrice),
                options = _.object(_.keys($widget.optionsMap), {}),
                result,
                formatedPrice;

            if ($widget.options.jsonConfig.hidePrice) {
                return;
            }
            $widget.element.find('.' + $widget.options.classes.attributeClass + '[' + $widget.options.renderSwatchOptionConfig.optionSelected + ']').each(function () {
                var attributeId = $(this).attr($widget.options.renderSwatchOptionConfig.attributeId);

                options[attributeId] = $(this).attr($widget.options.renderSwatchOptionConfig.optionSelected);
            });

            result = $widget.options.jsonConfig.optionPrices[_.findKey($widget.options.jsonConfig.index, options)];
            if (result) {
                formatedPrice = $widget.getFormattedPrice(result.finalPrice.amount, $widget);
                if ($widget.options.jsonConfig.defaultPriceWithRange && $widget.options.jsonConfig.priceRange) {
                    if (typeof $($product.find('.price-range')).html() !== 'undefined') {
                        if (-1 < $($product.find('.price-range')).html().indexOf('From')) {
                            if ($widget.options.jsonConfig.disaplyingFromToPrice) {
                                $($product.find('.price')[2]).html(formatedPrice);
                            } else {
                                $($product.find('.price')[1]).html(formatedPrice);
                            }
                        } else {
                            $($product.find('.price')[0]).html(formatedPrice);
                        }
                    }
                } else {
                    if (!$widget.options.jsonConfig.priceRange) {
                        $productPrice.html('<span class="price">' + formatedPrice + '</span>');
                    }
                }
                try {
                    $productPrice.trigger(
                        'updatePrice',
                        {
                            'prices': $widget._getPrices(result, $productPrice.priceBox('option').prices)
                        }
                    );
                } catch (e) {
                    console.log(e);
                }
            }


            if (typeof result !== 'undefined' && result.oldPrice.amount !== result.finalPrice.amount) {
                $(this.options.slyOldPriceSelector).show();
            } else {
                $(this.options.slyOldPriceSelector).hide();
            }
        },

        /**
         *
         * @param price
         * @param $widget
         * @param isShowSign
         * @returns {*}
         */
        getFormattedPrice: function (price, $widget, isShowSign = false) {
            return priceUtils.formatPrice(price, $widget.options.jsonConfig.priceFormat, isShowSign);
        },


        /**
         *
         * @private
         */
        _updateLink: function () {
            var $widget = this,
                $product = $widget.element.parents($widget.options.selectorProduct),
                $imageBlock = $product.parents('.product-item-info'),
                options = _.object(_.keys($widget.optionsMap), {}),
                simpleProductId = $widget.getProduct(),
                result;
            var deselectAll = true;
            $widget.element.find('.' + $widget.options.classes.attributeClass + '[' + $widget.options.renderSwatchOptionConfig.optionSelected + ']').each(function () {
                var attributeId = $(this).attr($widget.options.renderSwatchOptionConfig.attributeId);
                options[attributeId] = $(this).attr($widget.options.renderSwatchOptionConfig.optionSelected);
                if ($(this).attr($widget.options.renderSwatchOptionConfig.optionSelected)) {
                    deselectAll = false;
                }
            });
            if (_.findKey($widget.options.jsonConfig.index, options)) {
                simpleProductId = _.findKey($widget.options.jsonConfig.index, options);
            }
            if (typeof simpleProductId == 'undefined' || !simpleProductId) {
                simpleProductId = 'parent';
            }
            var linkSelectedOption = $widget.options.jsonConfig.urls[simpleProductId];
            if (_.findKey($widget.options.jsonConfig.index, options)) {
                if (linkSelectedOption) {
                    if (typeof $widget.options.jsonConfig.customAttributes[simpleProductId].name == 'undefined') {
                        $product.find('.product-item-link').attr('href', linkSelectedOption).html($widget.options.jsonConfig.customAttributes[simpleProductId]['.breadcrumbs .items .product'].value);
                        $imageBlock.find('.product-item-photo').attr('href', linkSelectedOption);
                    } else {
                        $product.find('.product-item-link').attr('href', linkSelectedOption).html($widget.options.jsonConfig.customAttributes[simpleProductId].name.value);
                        $imageBlock.find('.product-item-photo').attr('href', linkSelectedOption);
                    }
                }
            }
            if (deselectAll) {
                linkSelectedOption = $widget.options.jsonConfig.customAttributes.parent.parent_link;
                $imageBlock.find('.product-item-photo').attr('href', linkSelectedOption);
            }
            $($product.prev('.product-item-photo')).find('a').attr('href', linkSelectedOption);
        },

        /**
         *
         * @private
         */
        _updateName: function () {
            var $widget = this,
                product = $widget.element.parents($widget.options.selectorProduct),
                simpleProductId = $widget.getProduct(),
                linkSelectedOption = $widget.options.jsonConfig.urls[simpleProductId],
                simpleProductName = '';
            if (typeof simpleProductId == 'undefined' || !simpleProductId) {
                simpleProductId = 'parent';
            }
            if (typeof $widget.options.jsonConfig.customAttributes[simpleProductId].name !== 'undefined') {
                simpleProductName = $widget.options.jsonConfig.customAttributes[simpleProductId].name.value;
                product.find('.product-item-link').attr('href', linkSelectedOption).html(simpleProductName);
            }
        },

        /**
         *
         * @param {Number} attributeId
         * @param {Number} optionId
         * @param {Object} $widget
         * @private
         */
        _ChangeFromToPrice: function (attributeId, optionId, $widget) {
            var productsIds = [];
            var childProductIds = [];
            var productOptions = 0;
            var allSelectedOptionPrices = [];
            var minPrice = 0;
            var maxPrice = 0;
            var iteratorForCheckMinPrice = 0;
            var selectedAttributesForProducts = [];
            var iteratorForProductIds = 0;

            if ($widget.options.jsonConfig.hidePrice) {
                return;
            }
            $.each($widget.options.jsonConfig.attributes, function ($key, $item) {
                if ($('.' + $item.code + ' option:selected').val() != 0 && $item.id != attributeId && $item.type == 'select') {
                    selectedAttributesForProducts[$item.id] = parseInt($('.' + $item.code + ' option:selected').val());
                } else if (typeof ($('.' + $item.code).attr($widget.options.renderSwatchOptionConfig.optionSelected)) !== 'undefined') {
                    selectedAttributesForProducts[$item.id] = parseInt($('.' + $item.code).attr($widget.options.renderSwatchOptionConfig.optionSelected));
                }
            });
            if (typeof $widget.options.jsonSwatchConfig !== 'undefined') {
                $.each($widget.options.jsonConfig.mappedAttributes[attributeId].options, function ($key, $item) {
                    if (optionId == 0) {
                        productOptions = 1;
                        // childProductIds = productsIds.concat($item.products);
                        childProductIds.push($item.products);
                    } else {
                        if ($item.id == optionId) {
                            productsIds[iteratorForProductIds] = $item.products;
                            iteratorForProductIds++;
                        }
                    }
                });
                if (selectedAttributesForProducts.length != 0) {
                    selectedAttributesForProducts.forEach(function (item, i, selectedAttributesForProducts) {
                        $.each($widget.options.jsonConfig.mappedAttributes[i].options, function ($key, $item) {
                            if ($item.id == item) {
                                productsIds[iteratorForProductIds] = $item.products;
                                iteratorForProductIds++;
                            }
                        });
                    });
                    /*$.each(selectedAttributesForProducts, function ($key, $item) {

                    });*/
                }
            }
            if (productsIds.length != 0) {
                $.each(productsIds, function ($key, $item) {
                    $.each($item, function ($id, $val) {
                        if ($widget.options.jsonConfig.optionPrices[$val].finalPrice.amount != 0) {
                            allSelectedOptionPrices[iteratorForCheckMinPrice] = $widget.options.jsonConfig.optionPrices[$val].finalPrice.amount;
                            iteratorForCheckMinPrice++;
                        }
                        if (typeof ($widget.options.jsonConfig.considerTierPricesInFromToPrice) !== "undefined" &&
                            $widget.options.jsonConfig.considerTierPricesInFromToPrice == '1') {
                            $.each($widget.options.jsonConfig.optionPrices[$val].tierPrices, function () {
                                allSelectedOptionPrices[iteratorForCheckMinPrice] = this.price;
                                iteratorForCheckMinPrice++;
                            });
                        }
                    });
                });

                minPrice = Math.min.apply(Math, allSelectedOptionPrices);
                maxPrice = Math.max.apply(Math, allSelectedOptionPrices);

                if (minPrice == maxPrice) {
                    if ($widget.inProductList) {
                        $('.firebear_range_price, .firebear_range_price_' + $widget.options.jsonConfig.productId).html(
                            '<span class="price">From ' + $widget.getFormattedPrice(minPrice, $widget) + '</span>'
                        );
                    } else {
                        $('.firebear_range_price, .firebear_range_price_' + $widget.options.jsonConfig.productId).html(
                            'From ' + $widget.getFormattedPrice(minPrice, $widget)
                        );
                    }
                } else {
                    if ($widget.inProductList) {
                        $('.firebear_range_price, .firebear_range_price_' + $widget.options.jsonConfig.productId).html(
                            '<span class="price">From ' + $widget.getFormattedPrice(minPrice, $widget) +
                            ' - ' + $widget.getFormattedPrice(maxPrice, $widget) + '</span>');
                    } else {
                        $('.firebear_range_price, .firebear_range_price_' + $widget.options.jsonConfig.productId).html(
                            'From ' + $widget.getFormattedPrice(minPrice, $widget) +
                            ' - ' + $widget.getFormattedPrice(maxPrice, $widget)
                        );
                    }
                }
            } else {
                $('.firebear_range_price').html($('.price').html());
            }
        },

        /**
         *
         * @param productId
         * @param $widget
         * @private
         */
        _RenderCustomOptionsBySimpleProduct: function (productId, $widget) {
            $.ajax({
                url: $widget.options.jsonConfig.loadOptionsUrl,
                type: 'POST',
                dataType: 'json',
                showLoader: true,
                data: {
                    productId: productId
                },
                success: function (response, widget) {

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
                                                if (typeof response.optionsData[elementId] !== 'undefined') {
                                                    customOptionsPrice.push(parseFloat(response.optionsData[elementId]['price']));
                                                }
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
                            } else if (typeof response.optionsData[elementId] !== 'undefined'){
                                customOptionsPrice.push(parseFloat(response.optionsData[elementId]['price']));
                            }
                        });
                        if (customOptionsPrice.length > 0) {
                            $widget['customOptionsPrice'] = customOptionsPrice.reduce(getSum);
                        }
                        $widget._UpdatePrice();
                    });
                }
            });
        },

        /**
         *
         * @param productId
         * @param $widget
         * @public
         */
        _setOpenGraph: function (productId, $widget) {
            $.ajax({
                url: $widget.options.jsonConfig.setOpenGraphUrl,
                type: 'POST',
                dataType: 'json',
                data: {
                    productId: productId,
                },
                success: function (response) {
                    var property;
                    $.each($(response.openGraphHtml), function () {
                        property = $(this).attr('property');
                        if (property) {
                            $('meta[property="' + property + '"]').remove();
                        }

                    });
                    $('head').append(response.openGraphHtml);
                }
            });
        },

        /**
         * Update total price in product page
         *
         * @private
         */
        _UpdatePrice: function () {
            var $widget = this,
                $product = $widget.element.parents($widget.options.selectorProduct),
                $productPrice = $product.find(this.options.selectorProductPrice),
                options = _.object(_.keys($widget.optionsMap), {}),
                result,
                tierPriceHtml;

            $widget.element.find('.' + $widget.options.classes.attributeClass + '[' + $widget.options.renderSwatchOptionConfig.optionSelected + ']').each(function () {
                var attributeId = $(this).attr($widget.options.renderSwatchOptionConfig.attributeId);

                options[attributeId] = $(this).attr($widget.options.renderSwatchOptionConfig.optionSelected);
            });

            result = $widget.options.jsonConfig.optionPrices[_.findKey($widget.options.jsonConfig.index, options)];

            if (result) {
                if (typeof ($widget['resultBefore_' + _.findKey($widget.options.jsonConfig.index, options)]) == 'undefined') {
                    $widget['resultBefore_' + _.findKey($widget.options.jsonConfig.index, options)] = JSON.parse(JSON.stringify(result));
                } else {
                    result = null;
                    result = JSON.parse(JSON.stringify($widget['resultBefore_' + _.findKey($widget.options.jsonConfig.index, options)]));
                }
            }
            if (typeof ($widget.customOptionsPrice) !== 'undefined') {
                result.finalPrice.amount = result.finalPrice.amount + $widget.customOptionsPrice;
            }
            $productPrice.trigger(
                'updatePrice',
                {
                    'prices': $widget._getPrices(result, $productPrice.priceBox('option').prices)
                }
            );

            if (typeof result !== 'undefined' && result.oldPrice.amount !== result.finalPrice.amount) {
                $(this.options.slyOldPriceSelector).show();
            } else {
                $(this.options.slyOldPriceSelector).hide();
            }
            if (typeof result != 'undefined' && result.tierPrices.length) {
                if (this.options.tierPriceTemplate) {
                    tierPriceHtml = mageTemplate(
                        this.options.tierPriceTemplate,
                        {
                            'tierPrices': result.tierPrices,
                            '$t': $t,
                            'currencyFormat': this.options.jsonConfig.currencyFormat,
                            'priceUtils': priceUtils
                        }
                    );
                    $(this.options.tierPriceBlockSelector).html(tierPriceHtml).show();
                }
            } else {
                $(this.options.tierPriceBlockSelector).hide();
            }

            $(this.options.normalPriceLabelSelector).hide();
            _.each($('.' + this.options.classes.attributeOptionsWrapper), function (attribute) {
                if ($(attribute).find('.' + this.options.classes.optionClass + '.selected').length === 0) {
                    if ($(attribute).find('.' + this.options.classes.selectClass).length > 0) {
                        _.each($(attribute).find('.' + this.options.classes.selectClass), function (dropdown) {
                            if ($(dropdown).val() === '0') {
                                $(this.options.normalPriceLabelSelector).show();
                            }
                        }.bind(this));
                    } else {
                        $(this.options.normalPriceLabelSelector).show();
                    }
                }
            }.bind(this));
        },
    };

    $.mixinSuper('SwatchRenderer', icpSwatchMixin); // Breeze fix: apply mixin
});
