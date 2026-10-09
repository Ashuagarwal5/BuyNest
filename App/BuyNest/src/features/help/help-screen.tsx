import { Stack } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ErrorState } from '@/components/ui/error-state';
import { LoadingState } from '@/components/ui/loading-state';
import { PrimaryButton } from '@/components/ui/primary-button';
import { Screen } from '@/components/ui/screen';
import { SectionCard } from '@/components/ui/section-card';
import { Radius, Spacing } from '@/constants/theme';
import { useApiData } from '@/hooks/use-api-data';
import { useTheme } from '@/hooks/use-theme';
import { fetchShopInfo, type ShopInfo } from '@/services/api/catalog-api';

const SCREEN_EDGES = ['left', 'right', 'bottom'] as const;

/** Answers to the questions customers ask most. They describe how the app and the shop work today. */
const FAQ: { question: string; answer: string }[] = [
  {
    question: 'How do I place an order?',
    answer:
      'Add products to your cart, open the cart and tap Checkout. Enter your name, mobile number and delivery address, choose your delivery area, and tap Place Order.',
  },
  {
    question: 'How do I pay?',
    answer:
      'Payment is Cash on Delivery for now. You pay the delivery person when your order arrives.',
  },
  {
    question: 'What is the delivery charge?',
    answer:
      'It depends on your delivery area, and some areas get free delivery above a certain order amount. You see the exact charge at checkout before you order.',
  },
  {
    question: 'Can I cancel my order?',
    answer:
      'Yes, from the Orders tab while it is still Placed. Once the shop has confirmed it, please contact the shop using the details above.',
  },
  {
    question: 'How do I track my order?',
    answer:
      'Open the Orders tab and tap your order. It shows each step: placed, confirmed, packed, out for delivery and delivered.',
  },
  {
    question: 'Something is wrong with my order.',
    answer: 'Call or message the shop with your order number and we will sort it out.',
  },
];

/** Digits only, with India's 91 added to a 10-digit number, for a wa.me link. */
function whatsAppDigits(number: string): string {
  const digits = number.replace(/\D/g, '');
  return digits.length === 10 ? `91${digits}` : digits;
}

async function open(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Could not open', 'This phone has no app that can open it.');
  }
}

export function HelpScreen() {
  const theme = useTheme();
  const shop = useApiData('shop-info', (signal) => fetchShopInfo(signal));

  if (shop.status === 'loading') {
    return (
      <Screen edges={SCREEN_EDGES}>
        <Stack.Screen options={{ title: 'Help & Support' }} />
        <LoadingState />
      </Screen>
    );
  }
  if (shop.status === 'error') {
    return (
      <Screen edges={SCREEN_EDGES}>
        <Stack.Screen options={{ title: 'Help & Support' }} />
        <ErrorState error={shop.error} onRetry={shop.reload} />
      </Screen>
    );
  }

  return (
    <Screen edges={SCREEN_EDGES}>
      <Stack.Screen options={{ title: 'Help & Support' }} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={shop.isRefreshing}
            onRefresh={shop.reload}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }>
        <ContactCard shop={shop.data} />

        <SectionCard title="Common questions">
          <View style={styles.faq}>
            {FAQ.map((item) => (
              <FaqItem key={item.question} question={item.question} answer={item.answer} />
            ))}
          </View>
        </SectionCard>
      </ScrollView>
    </Screen>
  );
}

function ContactCard({ shop }: { shop: ShopInfo }) {
  const hasContact = shop.phone || shop.whatsapp || shop.email;

  return (
    <SectionCard title="Contact the shop">
      {hasContact ? (
        <View style={styles.buttons}>
          {shop.phone ? (
            <PrimaryButton title={`Call ${shop.phone}`} onPress={() => open(`tel:${shop.phone}`)} />
          ) : null}
          {shop.whatsapp ? (
            <PrimaryButton
              title="Chat on WhatsApp"
              variant="secondary"
              onPress={() => open(`https://wa.me/${whatsAppDigits(shop.whatsapp ?? '')}`)}
            />
          ) : null}
          {shop.email ? (
            <PrimaryButton
              title={`Email ${shop.email}`}
              variant="secondary"
              onPress={() => open(`mailto:${shop.email}`)}
            />
          ) : null}
        </View>
      ) : (
        <AppText color="textSecondary">The shop&apos;s contact details will be added soon.</AppText>
      )}

      {shop.hours ? (
        <View style={styles.detail}>
          <AppText variant="captionStrong" color="textSecondary">
            Opening hours
          </AppText>
          <AppText>{shop.hours}</AppText>
        </View>
      ) : null}
      {shop.address ? (
        <View style={styles.detail}>
          <AppText variant="captionStrong" color="textSecondary">
            Shop address
          </AppText>
          <AppText>{shop.address}</AppText>
        </View>
      ) : null}
    </SectionCard>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={[styles.faqItem, { borderColor: theme.border }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen((current) => !current)}
        style={styles.faqQuestion}>
        <AppText variant="bodyStrong" style={styles.faqText}>
          {question}
        </AppText>
        <AppText color="textSecondary">{isOpen ? '−' : '+'}</AppText>
      </Pressable>
      {isOpen ? (
        <AppText color="textSecondary" style={styles.faqAnswer}>
          {answer}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
  },
  buttons: {
    gap: Spacing.two,
  },
  detail: {
    gap: Spacing.half,
  },
  faq: {
    gap: Spacing.two,
  },
  faqItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: Spacing.two,
    borderRadius: Radius.small,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.three,
    minHeight: 44,
  },
  faqText: {
    flex: 1,
  },
  faqAnswer: {
    paddingBottom: Spacing.two,
  },
});
