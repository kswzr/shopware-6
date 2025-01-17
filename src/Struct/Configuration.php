<?php

declare(strict_types=1);

namespace PayonePayment\Struct;

use Shopware\Core\Framework\Struct\Struct;

class Configuration extends Struct
{
    protected array $configuration = [];

    public function __construct(array $configuration)
    {
        $this->configuration = $configuration;
    }

    /**
     * @param array|bool|int|string|null $default
     *
     * @return array|bool|int|string|null
     */
    public function getByPrefix(string $key, string $prefix = '', $default = '')
    {
        return $this->get(sprintf('%s%s', $prefix, ucfirst($key)), $default);
    }

    /**
     * @param array|bool|int|string|null $default
     *
     * @return array|bool|int|string|null
     */
    public function get(string $key, $default = '')
    {
        if (!\array_key_exists($key, $this->configuration)) {
            return $default;
        }

        if (empty($this->configuration[$key])) {
            return $default;
        }

        return $this->configuration[$key];
    }

    public function getString(string $key, string $default = ''): string
    {
        $value = $this->get($key, $default);

        if (\is_string($value) === false) {
            return $default;
        }

        return $value;
    }

    public function getBool(string $key, bool $default = false): bool
    {
        $value = $this->get($key, $default);

        if (\is_bool($value) === false) {
            return $default;
        }

        return $value;
    }
}
