<?php

declare(strict_types=1);

namespace PayonePayment\PaymentHandler;

interface PaymentHandlerGroups
{
    public const RATEPAY = [
        PayoneRatepayDebitPaymentHandler::class,
        PayoneRatepayInstallmentPaymentHandler::class,
        PayoneRatepayInvoicingPaymentHandler::class,
    ];
}
