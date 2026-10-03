import { Image } from 'expo-image';
import { type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { getCategoryIconById } from '@/features/catalog/category-visuals';
import { useTheme } from '@/hooks/use-theme';
import type { Product } from '@/types/catalog';

type ProductImageProps = {
  product: Product;
  iconSize?: number;
  style?: StyleProp<ViewStyle>;
};

/** Primary product image, or a category-icon placeholder while the product has no images. */
export function ProductImage({ product, iconSize = 40, style }: ProductImageProps) {
  const theme = useTheme();
  const primaryImage = product.images[0];

  return (
    <View style={[styles.container, { backgroundColor: theme.primarySoft }, style]}>
      {primaryImage ? (
        <Image
          source={{ uri: primaryImage }}
          contentFit="cover"
          accessibilityLabel={product.name}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <Icon name={getCategoryIconById(product.categoryId)} size={iconSize} color="primary" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
