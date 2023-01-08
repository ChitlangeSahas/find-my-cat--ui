import React, {
  useState, useEffect, useCallback,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Paper,
  Toolbar,
  IconButton,
  Button,
  Typography, Box,
} from '@mui/material';
import { makeStyles, styled } from '@mui/styles';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import AddIcon from '@mui/icons-material/Add';
import { grey } from '@mui/material/colors';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import DevicesList from './DevicesList';
import MapView from '../map/core/MapView';
import MapSelectedDevice from '../map/main/MapSelectedDevice';
import MapAccuracy from '../map/main/MapAccuracy';
import MapGeofence from '../map/main/MapGeofence';
import BottomMenu from '../common/components/BottomMenu';
import { useTranslation } from '../common/components/LocalizationProvider';
import PoiMap from '../map/main/PoiMap';
import MapPadding from '../map/MapPadding';
import StatusCard from './StatusCard';
import { devicesActions } from '../store';
import MapDefaultCamera from '../map/main/MapDefaultCamera';
import usePersistedState from '../common/util/usePersistedState';
import MapLiveRoutes from '../map/main/MapLiveRoutes';
import { useDeviceReadonly } from '../common/util/permissions';
import MapPositions from '../map/MapPositions';
import MapDirection from '../map/MapDirection';
import MapOverlay from '../map/overlay/MapOverlay';
import MapScale from '../map/MapScale';
import sendMqttMessageToDevice from '../messagesToDevice/mqtt.ts';

export const glassMorphism = {
  background: 'rgba(255,255,255,0.49)',
  backdropFilter: 'blur(25px)',
};

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    zIndex: 3,
    margin: theme.spacing(1.5),
    width: theme.dimensions.drawerWidthDesktop,
    bottom: 0,
    transition: 'transform .5s ease',
    ...glassMorphism,
    [theme.breakpoints.down('sm')]: {
      width: '100%',
      margin: 0,
    },
    borderRadius: '8px',
  },
  sidebarCollapsed: {
    transform: `translateX(-${theme.dimensions.drawerWidthDesktop})`,
    marginLeft: 0,
    [theme.breakpoints.down('md')]: {
      transform: 'translateX(-100vw)',
    },
  },
  toolbar: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 0,
    padding: theme.spacing(1.25, 1.25, 1, 2),
    '& > *': {
      // margin: theme.spacing(0, 0.5),
    },
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  deviceList: {
    flex: 1,
  },
  statusCard: {
    position: 'fixed',
    zIndex: 5,
    [theme.breakpoints.up('md')]: {
      left: `calc(50% + ${theme.dimensions.drawerWidthDesktop} / 2)`,
      bottom: theme.spacing(3),
    },
    [theme.breakpoints.down('md')]: {
      left: '50%',
      bottom: `calc(${theme.spacing(3)} + ${theme.dimensions.bottomBarHeight}px)`,
    },
    transform: 'translateX(-50%)',
  },
  sidebarToggle: {
    position: 'fixed',
    left: theme.spacing(1.5),
    top: theme.spacing(3),
    borderRadius: '0px',
    minWidth: 0,
    [theme.breakpoints.down('md')]: {
      left: 0,
    },
  },
  sidebarToggleText: {
    marginLeft: theme.spacing(1),
    [theme.breakpoints.only('xs')]: {
      display: 'none',
    },
  },
  sidebarToggleBg: {
    backgroundColor: 'white',
    color: 'rgba(0, 0, 0, 0.6)',
    '&:hover': {
      backgroundColor: 'white',
    },
  },
  bottomMenu: {
    borderRadius: '0 0 8px 8px',
  },
  filterPanel: {
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing(2),
    gap: theme.spacing(2),
    width: theme.dimensions.drawerWidthTablet,
  },
}));

const Puller = styled(Box)(() => ({
  width: 60,
  height: 6,
  backgroundColor: grey[700],
  borderRadius: 3,
  position: 'absolute',
  top: 8,
  left: 'calc(50% - 30px)',
  cursor: 'grab',
}));

const MainPage = () => {
  useEffect(() => {
    sendMqttMessageToDevice('ACTIVELY_TRACKING', 'A9G-topic');
  }, []);

  const classes = useStyles();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const t = useTranslation();

  const deviceReadonly = useDeviceReadonly();
  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const phone = useMediaQuery(theme.breakpoints.down('sm'));

  const [mapOnSelect] = usePersistedState('mapOnSelect', false);

  const [mapGeofences] = usePersistedState('mapGeofences', true);
  const [mapLiveRoutes] = usePersistedState('mapLiveRoutes', false);

  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.positions.items);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const selectedPosition = filteredPositions.find((position) => selectedDeviceId && position.deviceId === selectedDeviceId);

  const groups = useSelector((state) => state.groups.items);
  const devices = useSelector((state) => state.devices.items);
  const [filteredDevices, setFilteredDevices] = useState([]);

  const [filterKeyword] = useState('');
  const [filterStatuses, setFilterStatuses] = useState([]);
  const [filterGroups, setFilterGroups] = useState([]);
  const [filterSort, setFilterSort] = usePersistedState('filterSort', '');
  const [filterMap, setFilterMap] = usePersistedState('filterMap', false);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);

  const [devicesOpen, setDevicesOpen] = useState(false);
  const handleClose = () => {
    setDevicesOpen(!devicesOpen);
  };

  useEffect(() => setDevicesOpen(desktop), [desktop]);

  useEffect(() => {
    if (!desktop && mapOnSelect && selectedDeviceId) {
      setDevicesOpen(false);
    }
  }, [desktop, mapOnSelect, selectedDeviceId]);

  const onClick = useCallback((_, deviceId) => {
    dispatch(devicesActions.select(deviceId));
  }, [dispatch]);

  useEffect(() => {
    const filtered = Object.values(devices)
      .filter((device) => !filterStatuses.length || filterStatuses.includes(device.status))
      .filter((device) => !filterGroups.length || filterGroups.includes(device.groupId))
      .filter((device) => `${device.name} ${device.uniqueId}`.toLowerCase().includes(filterKeyword.toLowerCase()));
    if (filterSort === 'lastUpdate') {
      filtered.sort((device1, device2) => {
        const time1 = device1.lastUpdate ? moment(device1.lastUpdate).valueOf() : 0;
        const time2 = device2.lastUpdate ? moment(device2.lastUpdate).valueOf() : 0;
        return time2 - time1;
      });
    }
    setFilteredDevices(filtered);
    setFilteredPositions(filterMap
      ? filtered.map((device) => positions[device.id]).filter(Boolean)
      : Object.values(positions));
  }, [devices, positions, filterKeyword, filterStatuses, filterGroups, filterSort, filterMap]);

  let y;
  return (
    <div className={classes.root}>
      <MapView>
        <MapOverlay />
        {mapGeofences && <MapGeofence />}
        <MapAccuracy />
        {mapLiveRoutes && <MapLiveRoutes />}
        <MapPositions positions={filteredPositions} onClick={onClick} showStatus />
        {selectedPosition && selectedPosition.course && (
          <MapDirection position={selectedPosition} />
        )}
        <MapDefaultCamera />
        <MapSelectedDevice />
        <PoiMap />
      </MapView>
      <MapScale />
      {' '}
      {/* { phone && <MapPadding bottom={parseInt(250, 10)} />} */}
      { desktop && <MapPadding left={parseInt(theme.dimensions.drawerWidthDesktop, 10)} />}
      <Paper elevation={4} square className={`${classes.sidebar}`}>
        <Toolbar className={classes.toolbar} disableGutters>
          <Puller />
          <Typography variant="h6" unselectable="off">Devices</Typography>
          <IconButton onClick={() => navigate('/settings/device')} disabled={deviceReadonly}>
            <AddIcon />
          </IconButton>
        </Toolbar>
        <div className={classes.deviceList}>
          <DevicesList devices={filteredDevices} maxHeight={100} />
        </div>
        <div className={classes.bottomMenu}>
          <BottomMenu />
        </div>
      </Paper>

      {selectedDeviceId && (
        <div className={classes.statusCard}>
          <StatusCard
            deviceId={selectedDeviceId}
            onClose={() => dispatch(devicesActions.select(null))}
          />
        </div>
      )}
    </div>
  );
};

export default MainPage;
