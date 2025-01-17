<?php

declare(strict_types=1);

namespace PayonePayment\Payone\RequestParameter\Builder\Klarna;

use PayonePayment\PaymentHandler\PayoneKlarnaDirectDebitPaymentHandler;
use PayonePayment\PaymentHandler\PayoneKlarnaInstallmentPaymentHandler;
use PayonePayment\PaymentHandler\PayoneKlarnaInvoicePaymentHandler;
use PayonePayment\Payone\RequestParameter\Struct\AbstractRequestParameterStruct;
use PayonePayment\Payone\RequestParameter\Struct\KlarnaCreateSessionStruct;
use PayonePayment\Payone\RequestParameter\Struct\PaymentTransactionStruct;
use PayonePayment\Payone\RequestParameter\Struct\TestCredentialsStruct;

class FinancingTypeParameterBuilder extends AbstractKlarnaParameterBuilder
{
    public function getRequestParameter(AbstractRequestParameterStruct $arguments): array
    {
        switch ($arguments->getPaymentMethod()) {
            case PayoneKlarnaInvoicePaymentHandler::class:
                $type = 'KIV';

                break;
            case PayoneKlarnaInstallmentPaymentHandler::class:
                $type = 'KIS';

                break;
            case PayoneKlarnaDirectDebitPaymentHandler::class:
                $type = 'KDD';

                break;
            default:
                throw new \RuntimeException('invalid payment method');
        }

        return [
            'financingtype' => $type,
        ];
    }

    public function supports(AbstractRequestParameterStruct $arguments): bool
    {
        return parent::supports($arguments)
            && (
                $arguments instanceof KlarnaCreateSessionStruct
                || $arguments instanceof PaymentTransactionStruct
                || $arguments instanceof TestCredentialsStruct
            );
    }
}
