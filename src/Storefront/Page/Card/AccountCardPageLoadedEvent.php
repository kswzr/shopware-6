<?php

declare(strict_types=1);

namespace PayonePayment\Storefront\Page\Card;

use Shopware\Core\Framework\Context;
use Shopware\Core\Framework\Event\NestedEvent;
use Shopware\Core\System\SalesChannel\SalesChannelContext;
use Symfony\Component\HttpFoundation\Request;

class AccountCardPageLoadedEvent extends NestedEvent
{
    public const NAME = 'account-payone-card.page.loaded';

    protected AccountCardPage $page;

    protected SalesChannelContext $context;

    protected Request $request;

    public function __construct(
        AccountCardPage $page,
        SalesChannelContext $context,
        Request $request
    ) {
        $this->page = $page;
        $this->context = $context;
        $this->request = $request;
    }

    public function getName(): string
    {
        return self::NAME;
    }

    public function getContext(): Context
    {
        return $this->context->getContext();
    }

    public function getSalesChannelContext(): SalesChannelContext
    {
        return $this->context;
    }

    public function getPage(): AccountCardPage
    {
        return $this->page;
    }

    public function getRequest(): Request
    {
        return $this->request;
    }
}
