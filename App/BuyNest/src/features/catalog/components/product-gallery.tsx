import { useVideoPlayer, VideoView } from 'expo-video';
import { Image } from 'expo-image';
import { useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Radius, Spacing } from '@/constants/theme';
import { ProductImage } from '@/features/catalog/components/product-image';
import { useTheme } from '@/hooks/use-theme';
import { resolveMediaUrl } from '@/services/api/config';
import type { Product } from '@/types/catalog';

/** Matches the screen's own side padding, so each picture is exactly one page wide. */
const SIDE_PADDING = Spacing.three;
const PICTURE_RATIO = 4 / 3;
const MAX_PICTURE_HEIGHT = 320;

type ProductGalleryProps = { product: Product };

/**
 * The product's pictures as a swipeable strip, then its videos. A product with no pictures
 * shows the category-icon placeholder instead, and one picture is shown without any strip.
 */
export function ProductGallery({ product }: ProductGalleryProps) {
  const videos = product.videos ?? [];
  return (
    <View style={styles.container}>
      <PictureStrip product={product} />
      {videos.map((url, index) => (
        <ProductVideo key={`${url}-${index}`} url={url} label={`${product.name} video ${index + 1}`} />
      ))}
    </View>
  );
}

function PictureStrip({ product }: ProductGalleryProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const pageWidth = width - SIDE_PADDING * 2;
  const height = Math.min(pageWidth / PICTURE_RATIO, MAX_PICTURE_HEIGHT);

  if (product.images.length <= 1) {
    return <ProductImage product={product} iconSize={96} style={styles.image} />;
  }

  return (
    <View style={styles.strip}>
      <FlatList
        data={product.images}
        keyExtractor={(url, index) => `${url}-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) =>
          setPage(Math.round(event.nativeEvent.contentOffset.x / pageWidth))
        }
        getItemLayout={(_data, index) => ({ length: pageWidth, offset: pageWidth * index, index })}
        renderItem={({ item, index }) => (
          <View style={{ width: pageWidth, height, backgroundColor: theme.primarySoft, borderRadius: Radius.large, overflow: 'hidden' }}>
            <Image
              source={{ uri: resolveMediaUrl(item) }}
              contentFit="cover"
              accessibilityLabel={`${product.name}, picture ${index + 1} of ${product.images.length}`}
              style={StyleSheet.absoluteFill}
            />
          </View>
        )}
      />
      <AppText variant="caption" color="textSecondary" style={styles.counter}>
        {page + 1} / {product.images.length}
      </AppText>
    </View>
  );
}

function ProductVideo({ url, label }: { url: string; label: string }) {
  const theme = useTheme();
  // The player is created paused; the customer starts it with the built-in controls.
  const player = useVideoPlayer(resolveMediaUrl(url));

  return (
    <VideoView
      player={player}
      nativeControls
      contentFit="contain"
      accessibilityLabel={label}
      style={[styles.video, { backgroundColor: theme.primarySoft }]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.three,
  },
  image: {
    aspectRatio: PICTURE_RATIO,
    maxHeight: MAX_PICTURE_HEIGHT,
    alignSelf: 'stretch',
    borderRadius: Radius.large,
  },
  strip: {
    gap: Spacing.two,
  },
  counter: {
    textAlign: 'center',
  },
  video: {
    aspectRatio: 16 / 9,
    alignSelf: 'stretch',
    borderRadius: Radius.large,
    overflow: 'hidden',
  },
});
