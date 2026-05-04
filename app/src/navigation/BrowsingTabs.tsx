import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../design/ThemeProvider';
import type { TubeArchivistClient } from '../services/tubeArchivist';
import { ChannelDetailScreen } from '../screens/browsing/ChannelDetailScreen';
import { ChannelsScreen } from '../screens/browsing/ChannelsScreen';
import { ContinueWatchingScreen } from '../screens/browsing/ContinueWatchingScreen';
import { HomeScreen } from '../screens/browsing/HomeScreen';
import { PlaylistsScreen } from '../screens/browsing/PlaylistsScreen';
import { SearchScreen } from '../screens/browsing/SearchScreen';

type BrowsingTabParamList = {
  Home: undefined;
  Channels: undefined;
  Playlists: undefined;
  Search: undefined;
};

const Tab = createBottomTabNavigator<BrowsingTabParamList>();
type HomeStackParamList = {
  HomeRoot: undefined;
  ContinueWatching: undefined;
};
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
type ChannelsStackParamList = {
  ChannelsRoot: undefined;
  ChannelDetail: { channelId: string };
};
const ChannelsStack = createNativeStackNavigator<ChannelsStackParamList>();
const iconNameByRoute: Record<keyof BrowsingTabParamList, string> = {
  Home: 'home-outline',
  Channels: 'television-play',
  Playlists: 'playlist-play',
  Search: 'magnify',
};

function buildTabBarIcon(routeName: keyof BrowsingTabParamList) {
  return function TabBarIcon({ color, size }: { color: string; size: number }) {
    return <MaterialCommunityIcons color={color} name={iconNameByRoute[routeName]} size={size} />;
  };
}

type BrowsingTabsProps = {
  client: TubeArchivistClient;
  onOpenVideo: (videoId: string) => Promise<void>;
};

function HomeTabNavigator({ client, onOpenVideo }: BrowsingTabsProps) {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeRoot">
        {() => (
          <HomeScreen
            client={client}
            onOpenVideo={onOpenVideo}
          />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen name="ContinueWatching">
        {() => <ContinueWatchingScreen client={client} onOpenVideo={onOpenVideo} />}
      </HomeStack.Screen>
    </HomeStack.Navigator>
  );
}

function ChannelsTabNavigator({ client }: { client: TubeArchivistClient }) {
  return (
    <ChannelsStack.Navigator screenOptions={{ headerShown: false }}>
      <ChannelsStack.Screen name="ChannelsRoot">
        {({ navigation }) => (
          <ChannelsScreen
            client={client}
            onOpenChannel={channelId => {
              navigation.navigate('ChannelDetail', { channelId });
            }}
          />
        )}
      </ChannelsStack.Screen>
      <ChannelsStack.Screen name="ChannelDetail">
        {({ route }) => <ChannelDetailScreen channelId={route.params.channelId} client={client} />}
      </ChannelsStack.Screen>
    </ChannelsStack.Navigator>
  );
}

function BrowsingTabs({ client, onOpenVideo }: BrowsingTabsProps) {
  const { theme } = useTheme();
  const { colors } = theme;

  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Home"
        screenOptions={({ route }) => {
          return {
            headerShown: false,
            tabBarActiveTintColor: colors.accent,
            tabBarInactiveTintColor: colors.textSecondary,
            tabBarStyle: {
              backgroundColor: colors.surfaceBackground,
              borderTopColor: colors.border,
            },
            tabBarIcon: buildTabBarIcon(route.name),
          };
        }}
      >
        <Tab.Screen name="Home">
          {() => <HomeTabNavigator client={client} onOpenVideo={onOpenVideo} />}
        </Tab.Screen>
        <Tab.Screen name="Channels">
          {() => <ChannelsTabNavigator client={client} />}
        </Tab.Screen>
        <Tab.Screen component={PlaylistsScreen} name="Playlists" />
        <Tab.Screen component={SearchScreen} name="Search" />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export { BrowsingTabs };
