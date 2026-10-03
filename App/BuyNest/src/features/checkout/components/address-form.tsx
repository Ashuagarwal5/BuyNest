import { useRef } from 'react';
import type { TextInput } from 'react-native';

import { FormField } from '@/components/ui/form-field';
import { SectionCard } from '@/components/ui/section-card';
import type { CheckoutDetails, CheckoutErrors } from '@/features/checkout/checkout-details';

type TextField = Exclude<keyof CheckoutDetails, 'deliveryAreaId'>;

type AddressFormProps = {
  details: CheckoutDetails;
  /** Only the errors that should currently be visible. */
  errors: CheckoutErrors;
  onChange: (field: TextField, value: string) => void;
  onBlur: (field: TextField) => void;
};

export function AddressForm({ details, errors, onChange, onBlur }: AddressFormProps) {
  const phoneRef = useRef<TextInput>(null);
  const line1Ref = useRef<TextInput>(null);
  const line2Ref = useRef<TextInput>(null);
  const landmarkRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const pincodeRef = useRef<TextInput>(null);

  const bind = (field: TextField) => ({
    value: details[field],
    error: errors[field],
    onChangeText: (value: string) => onChange(field, value),
    onBlur: () => onBlur(field),
  });

  return (
    <>
      <SectionCard title="Contact Details">
        <FormField
          label="Full Name"
          placeholder="Name of the person receiving the order"
          autoCapitalize="words"
          autoComplete="name"
          textContentType="name"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => phoneRef.current?.focus()}
          {...bind('fullName')}
        />
        <FormField
          ref={phoneRef}
          label="Mobile Number"
          placeholder="10-digit mobile number"
          keyboardType="phone-pad"
          autoComplete="tel"
          textContentType="telephoneNumber"
          maxLength={14}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => line1Ref.current?.focus()}
          {...bind('phone')}
        />
      </SectionCard>

      <SectionCard title="Delivery Address">
        <FormField
          ref={line1Ref}
          label="Address Line 1"
          placeholder="House / flat number, street"
          autoCapitalize="words"
          autoComplete="address-line1"
          textContentType="streetAddressLine1"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => line2Ref.current?.focus()}
          {...bind('addressLine1')}
        />
        <FormField
          ref={line2Ref}
          label="Address Line 2"
          optional
          placeholder="Colony, building, floor"
          autoCapitalize="words"
          autoComplete="address-line2"
          textContentType="streetAddressLine2"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => landmarkRef.current?.focus()}
          {...bind('addressLine2')}
        />
        <FormField
          ref={landmarkRef}
          label="Landmark"
          optional
          placeholder="Nearby shop, temple, school"
          autoCapitalize="words"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => cityRef.current?.focus()}
          {...bind('landmark')}
        />
        <FormField
          ref={cityRef}
          label="City"
          placeholder="City or town"
          autoCapitalize="words"
          textContentType="addressCity"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => pincodeRef.current?.focus()}
          {...bind('city')}
        />
        <FormField
          ref={pincodeRef}
          label="Pincode"
          placeholder="6-digit pincode"
          keyboardType="number-pad"
          autoComplete="postal-code"
          textContentType="postalCode"
          maxLength={6}
          returnKeyType="done"
          {...bind('pincode')}
        />
      </SectionCard>
    </>
  );
}
