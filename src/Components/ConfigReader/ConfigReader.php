<?php

declare(strict_types=1);

namespace PayonePayment\Components\ConfigReader;

use PayonePayment\Configuration\ConfigurationPrefixes;
use PayonePayment\Struct\Configuration;
use Shopware\Core\System\SystemConfig\SystemConfigService;

class ConfigReader implements ConfigReaderInterface
{
    public const SYSTEM_CONFIG_DOMAIN = 'PayonePayment.settings.';

    private SystemConfigService $systemConfigService;

    public function __construct(SystemConfigService $systemConfigService)
    {
        $this->systemConfigService = $systemConfigService;
    }

    public static function getConfigKeyByPaymentHandler(string $paymentHandler, string $configuration): string
    {
        return self::SYSTEM_CONFIG_DOMAIN . ConfigurationPrefixes::CONFIGURATION_PREFIXES[$paymentHandler] . $configuration;
    }

    public function read(?string $salesChannelId = null, bool $fallback = true): Configuration
    {
        $values = $this->systemConfigService->getDomain(
            self::SYSTEM_CONFIG_DOMAIN,
            $salesChannelId,
            $fallback
        );

        $config = [];

        foreach ($values as $key => $value) {
            $property = substr($key, \strlen(self::SYSTEM_CONFIG_DOMAIN));

            $config[$property] = $value;
        }

        return new Configuration($config);
    }
}
