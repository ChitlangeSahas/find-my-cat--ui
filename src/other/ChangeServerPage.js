import React, { useState } from 'react';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import { makeStyles } from '@mui/styles';
import {
  Autocomplete, Button, Container, TextField,
} from '@mui/material';
import { useTranslation } from '../common/components/LocalizationProvider';

const currentServer = `${window.location.protocol}//${window.location.host}`;

const officialServers = [
  currentServer,
  'https://demo.traccar.org',
  'https://demo2.traccar.org',
  'https://demo3.traccar.org',
  'https://demo4.traccar.org',
  'https://server.traccar.org',
  'http://localhost:8082',
];

const useStyles = makeStyles((theme) => ({
  icon: {
    textAlign: 'center',
    fontSize: '128px',
    color: theme.palette.colors.neutral,
  },
  container: {
    textAlign: 'center',
    padding: theme.spacing(5, 3),
  },
  field: {
    margin: theme.spacing(3, 0),
  },
}));

const ChangeServerPage = () => {
  const classes = useStyles();
  const t = useTranslation();

  const [url, setUrl] = useState(currentServer);

  const handleSubmit = () => {
    if (window.webkit && window.webkit.messageHandlers.appInterface) {
      window.webkit.messageHandlers.appInterface.postMessage(`server|${url}`);
    } else if (window.appInterface) {
      window.appInterface.postMessage(`server|${url}`);
    } else {
      window.location.replace(url);
    }
  };

  return (
    <Container maxWidth="xs" className={classes.container}>
      <ElectricalServicesIcon className={classes.icon} />
      <Autocomplete
        freeSolo
        className={classes.field}
        options={officialServers}
        renderInput={(params) => <TextField {...params} label={t('settingsServer')} />}
        value={url}
        onChange={(_, value) => setUrl(value)}
      />
      <Button variant="outlined" color="secondary" onClick={handleSubmit}>{t('sharedSave')}</Button>
    </Container>
  );
};

export default ChangeServerPage;
