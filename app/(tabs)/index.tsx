import {
  View,
  Text,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/header";
import { BANNERS } from "@/assets/assets";
import { useRouter } from "expo-router";
import { CATEGORIES } from "@/constants";
import CategoryItem from "@/components/CategoryItem";
const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;

export default function Home() {
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);
  const router = useRouter();
  const categories = [{ id: "all", name: "All", icon: "grid" }, ...CATEGORIES];

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      <Header title="Forever" showMenu showCart showLogo />

      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Banner Slider */}

        <View className="mb-6">
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            className="w-full h-48 rounded-xl"
            scrollEventThrottle={16}
            onScroll={(event) => {
              const slide = Math.ceil(
                event.nativeEvent.contentOffset.x /
                  event.nativeEvent.layoutMeasurement.width,
              );
              if (slide !== activeBannerIndex) {
                setActiveBannerIndex(slide);
              }
            }}
          >
            {BANNERS.map((banner, index) => (
              <View
                key={index}
                className="relative w-full h-48 bg-gray-200 overflow-hidden"
                style={{ width: width - 32 }}
              >
                <Image
                  source={{ uri: banner.image }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
                <View className="absolute bottom-4 left-4 z-10">
                  <Text className="text-white text-2xl font-bold">
                    {banner.title}
                  </Text>
                  <Text className="text-white text-sm font-medium">
                    {banner.subtitle}
                  </Text>
                  <TouchableOpacity className="mt-2 bg-white px-4 py-2 rounded-full self-start">
                    <Text className="text-primary font-bold text-xs">
                      Get Now
                    </Text>
                  </TouchableOpacity>
                </View>
                <View className="absolute inset-0 bg-black/40" />
              </View>
            ))}
          </ScrollView>

          {/* Pagination dot */}
          <View className="flex-row justify-center mt-3 gap-2">
            {BANNERS.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full ${index === activeBannerIndex ? "w-6 bg-primary" : "w-2 bg-gray-300"}`}
              />
            ))}
          </View>
        </View>

        {/* Categories */}

        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-primary">Categories</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((cat: any) => (
              <CategoryItem
                key={cat.id}
                item={cat}
                isSelected={false}
                onPress={() =>
                  router.push({
                    pathname: "/shop",
                    params: { category: cat.id === "all" ? "" : cat.name },
                  })
                }
              />
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
