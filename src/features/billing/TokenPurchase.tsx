'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Env } from '@/libs/Env';

export const TokenPurchase = () => {
  const t = useTranslations('Chat');
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const onPurchase = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: Env.NEXT_PUBLIC_STRIPE_PRICE_ID,
          quantity,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Something went wrong', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <h3 className="text-lg font-bold">{t('token_purchase_title')}</h3>
      <p className="text-sm text-muted-foreground">
        {t('token_purchase_description')}
      </p>
      <div className="flex flex-col gap-2">
        <Label htmlFor="quantity">{t('token_purchase_quantity')}</Label>
        <Input
          id="quantity"
          type="number"
          min="1"
          value={quantity}
          onChange={e => setQuantity(Number.parseInt(e.target.value) || 1)}
          disabled={isLoading}
        />
      </div>
      <Button onClick={onPurchase} disabled={isLoading}>
        {isLoading ? t('token_purchase_redirecting') : t('token_purchase_button')}
      </Button>
    </div>
  );
};
