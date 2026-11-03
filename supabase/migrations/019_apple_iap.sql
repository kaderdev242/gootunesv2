-- IAP Apple : payment_method + index anti-rejeu transactionId
alter type public.payment_method add value if not exists 'apple';

create unique index if not exists purchases_apple_tx_uidx
  on public.purchases (provider_transaction_id)
  where provider = 'apple' and provider_transaction_id is not null;
q