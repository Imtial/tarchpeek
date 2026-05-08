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
import { PlaylistDetailScreen } from '../screens/browsing/PlaylistDetailScreen';
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
type PlaylistsStackParamList = {
  PlaylistsRoot: undefined;
  PlaylistDetail: { playlistId: string };
};
const PlaylistsStack = createNativeStackNavigator<PlaylistsStackParamList>();
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
  browseRefreshKey: number;
  client: TubeArchivistClient;
  onOpenVideo: (videoId: string) => Promise<void>;
};

type VideoOpenProps = {
  client: TubeArchivistClient;
  onOpenVideo: (videoId: string) => Promise<void>;
};

function HomeTabNavigator({ browseRefreshKey, client, onOpenVideo }: BrowsingTabsProps) {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeRoot">
        {() => (
          <HomeScreen
            browseRefreshKey={browseRefreshKey}
            client={client}
            onOpenVideo={onOpenVideo}
          />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen name="ContinueWatching">
        {() => (
          <ContinueWatchingScreen
            browseRefreshKey={browseRefreshKey}
            client={client}
            onOpenVideo={onOpenVideo}
          />
        )}
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

function PlaylistsTabNavigator({ client, onOpenVideo }: VideoOpenProps) {
  return (
    <PlaylistsStack.Navigator screenOptions={{ headerShown: false }}>
      <PlaylistsStack.Screen name="PlaylistsRoot">
        {({ navigation }) => (
          <PlaylistsScreen
            client={client}
            onOpenPlaylist={playlistId => {
              navigation.navigate('PlaylistDetail', { playlistId });
            }}
          />
        )}
      </PlaylistsStack.Screen>
      <PlaylistsStack.Screen name="PlaylistDetail">
        {({ route }) => (
          <PlaylistDetailScreen
            client={client}
            onOpenVideo={onOpenVideo}
            playlistId={route.params.playlistId}
          />
        )}
      </PlaylistsStack.Screen>
    </PlaylistsStack.Navigator>
  );
}

function BrowsingTabs({ browseRefreshKey, client, onOpenVideo }: BrowsingTabsProps) {
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
            tabBarActiveBackgroundColor: colors.surfaceBackground,
            tabBarItemStyle: {
              borderRadius: 0,
              marginHorizontal: 0,
              marginVertical: 0,
              paddingVertical: 0,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
            },
            tabBarStyle: {
              backgroundColor: colors.pageBackground,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              elevation: 8,
              shadowColor: '#000000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.12,
              shadowRadius: 8,
              paddingBottom: 0,
              paddingTop: 0,
              height: 62,
            },
            tabBarIcon: buildTabBarIcon(route.name),
            tabBarIconStyle: {
              marginTop: 0,
            },
          };
        }}
      >
        <Tab.Screen name="Home">
          {() => <HomeTabNavigator browseRefreshKey={browseRefreshKey} client={client} onOpenVideo={onOpenVideo} />}
        </Tab.Screen>
        <Tab.Screen name="Channels">
          {() => <ChannelsTabNavigator client={client} />}
        </Tab.Screen>
        <Tab.Screen name="Playlists">
          {() => <PlaylistsTabNavigator client={client} onOpenVideo={onOpenVideo} />}
        </Tab.Screen>
        <Tab.Screen name="Search">
          {() => <SearchScreen client={client} onOpenVideo={onOpenVideo} />}
        </Tab.Screen>
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export { BrowsingTabs };
