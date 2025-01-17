import template from './capture.html.twig';
import './style.scss';

const { Component, Mixin, Context } = Shopware;

Component.register('payone-capture-button', {
    template,

    mixins: [
        Mixin.getByName('notification')
    ],

    inject: ['PayonePaymentService', 'repositoryFactory'],

    props: {
        order: {
            type: Object,
            required: true
        },
        transaction: {
            type: Object,
            required: true
        }
    },

    computed: {
        decimalPrecision() {
            if (!this.order || !this.order.currency) {
                return 2;
            }
            if (this.order.currency.decimalPrecision) {
                return this.order.currency.decimalPrecision;
            }
            if (this.order.currency.itemRounding) {
                return this.order.currency.itemRounding.decimals;
            }
        },

        totalTransactionAmount() {
            return Math.round(this.transaction.amount.totalPrice * (10 ** this.decimalPrecision), 0);
        },

        capturedAmount() {
            if (!this.transaction.extensions
                || !this.transaction.extensions.payonePaymentOrderTransactionData
                || !this.transaction.extensions.payonePaymentOrderTransactionData.capturedAmount) {
                return 0;
            }

            return this.transaction.extensions.payonePaymentOrderTransactionData.capturedAmount;
        },

        remainingAmount() {
            return this.totalTransactionAmount - this.capturedAmount;
        },

        maxCaptureAmount() {
            return this.remainingAmount / (10 ** this.decimalPrecision);
        },

        buttonEnabled() {
            if (!this.transaction.extensions
                || !this.transaction.extensions.payonePaymentOrderTransactionData) {
                return false;
            }

            return (this.remainingAmount > 0 && this.capturedAmount > 0) || this.transaction.extensions.payonePaymentOrderTransactionData.allowCapture;
        },

        isItemSelected() {
            let returnValue = false;

            this.selection.forEach((selection) => {
                if (selection.selected) {
                    returnValue = true;
                }
            });

            return returnValue;
        },

        hasRemainingShippingCosts() {
            if (this.order.shippingCosts.totalPrice <= 0) {
                return false;
            }

            const shippingCosts = this.order.shippingCosts.totalPrice * (10 ** this.decimalPrecision);

            let capturedPositionAmount = 0;

            this.order.lineItems.forEach((order_item) => {
                if (order_item.customFields && order_item.customFields.payone_captured_quantity
                    && 0 < order_item.customFields.payone_captured_quantity) {
                    capturedPositionAmount += order_item.customFields.payone_captured_quantity * order_item.unitPrice * (10 ** this.decimalPrecision);
                }
            });

            if (this.capturedAmount - Math.round(capturedPositionAmount) >= shippingCosts) {
                return false;
            }

            return true;
        }
    },

    data() {
        return {
            isLoading: false,
            hasError: false,
            showCaptureModal: false,
            isCaptureSuccessful: false,
            selection: [],
            captureAmount: 0.0,
            includeShippingCosts: false
        };
    },

    methods: {
        calculateCaptureAmount() {
            let amount = 0;

            this.selection.forEach((selection) => {
                if (selection.selected) {
                    amount += selection.unit_price * selection.quantity;
                }
            });

            if (amount > this.remainingAmount) {
                amount = this.remainingAmount;
            }

            this.captureAmount = amount;
        },

        openCaptureModal() {
            this.showCaptureModal = true;
            this.isCaptureSuccessful = false;
            this.selection = [];
        },

        closeCaptureModal() {
            this.showCaptureModal = false;
        },

        onCaptureFinished() {
            this.isCaptureSuccessful = false;
        },

        captureOrder() {
            const request = {
                orderTransactionId: this.transaction.id,
                payone_order_id: this.transaction.extensions.payonePaymentOrderTransactionData.transactionId,
                salesChannel: this.order.salesChannel,
                amount: this.captureAmount,
                orderLines: [],
                complete: this.captureAmount === this.remainingAmount,
                includeShippingCosts: false
            };

            this.isLoading = true;

            this.selection.forEach((selection) => {
                this.order.lineItems.forEach((order_item) => {
                    if (order_item.id === selection.id && selection.selected && 0 < selection.quantity) {
                        const copy = { ...order_item },
                            taxRate = copy.tax_rate / (10 ** request.decimalPrecision);

                        copy.quantity         = selection.quantity;
                        copy.total_amount     = copy.unit_price * copy.quantity;
                        copy.total_tax_amount = Math.round(copy.total_amount / (100 + taxRate) * taxRate);

                        request.orderLines.push(copy);
                    }
                });

                if (selection.id === 'shipping' && selection.selected && 0 < selection.quantity) {
                    request.includeShippingCosts = true;
                }
            });

            if (this.remainingAmount < (request.amount * (10 ** this.decimalPrecision))) {
                request.amount = this.remainingAmount / (10 ** this.decimalPrecision);
            }

            this.executeCapture(request)
        },

        captureFullOrder() {
            const request = {
                orderTransactionId: this.transaction.id,
                payone_order_id: this.transaction.extensions.payonePaymentOrderTransactionData.transactionId,
                salesChannel: this.order.salesChannel,
                amount: this.remainingAmount / (10 ** this.decimalPrecision),
                orderLines: [],
                complete: true,
                includeShippingCosts: this.hasRemainingShippingCosts
            };

            this.isLoading = true;

            this.order.lineItems.forEach((order_item) => {
                let quantity = order_item.quantity;

                if (order_item.customFields && order_item.customFields.payone_captured_quantity
                    && 0 < order_item.customFields.payone_captured_quantity) {
                    quantity -= order_item.customFields.payone_captured_quantity;
                }

                request.orderLines.push({
                    id: order_item.id,
                    quantity: quantity,
                    unit_price: order_item.unitPrice,
                    selected: false
                });
            });

            this.executeCapture(request);
        },

        executeCapture(request) {
            this.PayonePaymentService.capturePayment(request).then(() => {
                this.createNotificationSuccess({
                    title: this.$tc('payone-payment.capture.successTitle'),
                    message: this.$tc('payone-payment.capture.successMessage')
                });

                this.isCaptureSuccessful = true;
            }).catch((error) => {
                this.createNotificationError({
                    title: this.$tc('payone-payment.capture.errorTitle'),
                    message: error.message
                });

                this.isCaptureSuccessful = false;
            }).finally(() => {
                this.isLoading = false;
                this.closeCaptureModal();

                this.$nextTick().then(() => {
                    this.$emit('reload')
                });
            });
        },

        onSelectItem(id, selected) {
            if (this.selection.length === 0) {
                this._populateSelectionProperty();
            }

            this.selection.forEach((selection) => {
                if (selection.id === id) {
                    selection.selected = selected;
                }
            });

            this.calculateCaptureAmount();
        },

        onChangeQuantity(id, quantity) {
            if (this.selection.length === 0) {
                this._populateSelectionProperty();
            }

            this.selection.forEach((selection) => {
                if (selection.id === id) {
                    selection.quantity = quantity;
                }
            });

            this.calculateCaptureAmount();
        },

        _populateSelectionProperty() {
            this.order.lineItems.forEach((order_item) => {
                let quantity = order_item.quantity;

                if (order_item.customFields && order_item.customFields.payone_captured_quantity
                    && 0 < order_item.customFields.payone_captured_quantity) {
                    quantity -= order_item.customFields.payone_captured_quantity;
                }

                this.selection.push({
                    id: order_item.id,
                    quantity: quantity,
                    unit_price: order_item.unitPrice,
                    selected: false
                });
            });

            if (this.order.shippingCosts.totalPrice > 0) {
                this.selection.push({
                    id: 'shipping',
                    quantity: 1,
                    unit_price: this.order.shippingCosts.totalPrice,
                    selected: false
                });
            }
        }
    }
});
