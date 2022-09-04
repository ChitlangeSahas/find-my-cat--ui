import moment from 'moment';
import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import {
  Accordion, AccordionSummary, AccordionDetails, Typography, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import makeStyles from '@mui/styles/makeStyles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { DropzoneArea } from 'react-mui-dropzone';
import EditItemView from './components/EditItemView';
import EditAttributesAccordion from './components/EditAttributesAccordion';
import { useTranslation } from '../common/components/LocalizationProvider';
import SettingsMenu from './components/SettingsMenu';
import { prefixString } from '../common/util/stringUtils';

const formatTime = (time) => {
  const tzid = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return `TZID=${tzid}:${time.format('YYYYMMDDTHHmmss')}`;
};

const parseRule = (rule) => {
  const fragments = rule.split(';');
  const frequency = fragments[0].includes('FREQ') ? fragments[0].substring(11) : 'ONCE';
  const by = fragments.length > 1 ? fragments[1].split('=')[1].split(',') : null;
  return { frequency, by };
};

const formatRule = (rule) => {
  const by = rule.by && rule.by.join(',');
  switch (rule.frequency) {
    case 'DAILY':
      return `RRULE:FREQ=${rule.frequency}`;
    case 'WEEKLY':
      return `RRULE:FREQ=${rule.frequency};BYDAY=${by || 'SU'}`;
    case 'MONTHLY':
      return `RRULE:FREQ=${rule.frequency};BYMONTHDAY=${by || 1}`;
    default:
      return 'RRULE:';
  }
};

const updateCalendar = (lines, index, element) => window.btoa(lines.map((e, i) => (i !== index ? e : element)).join('\n'));

const simpleCalendar = () => window.btoa([
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//Traccar//NONSGML Traccar//EN',
  'BEGIN:VEVENT',
  'UID:00000000-0000-0000-0000-000000000000',
  `DTSTART;${formatTime(moment())}`,
  `DTEND;${formatTime(moment().add(1, 'hours'))}`,
  'RRULE:FREQ=DAILY',
  'SUMMARY:Event',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\n'));

const useStyles = makeStyles((theme) => ({
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    paddingBottom: theme.spacing(3),
  },
}));

const CalendarPage = () => {
  const classes = useStyles();
  const t = useTranslation();

  const [item, setItem] = useState();

  const decoded = item && item.data && window.atob(item.data);

  const simple = decoded && decoded.indexOf('//Traccar//') > 0;

  const lines = decoded && decoded.split('\n');

  const rule = simple && parseRule(lines[7]);

  const handleFiles = (files) => {
    if (files.length > 0) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const { result } = event.target;
        setItem({ ...item, data: result.substr(result.indexOf(',') + 1) });
      };
      reader.readAsDataURL(files[0]);
    }
  };

  const validate = () => item && item.name && item.data;

  return (
    <EditItemView
      endpoint="calendars"
      item={item}
      setItem={setItem}
      defaultItem={{ data: simpleCalendar() }}
      validate={validate}
      menu={<SettingsMenu />}
      breadcrumbs={['settingsTitle', 'sharedCalendar']}
    >
      {item && (
        <>
          <Accordion defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1">
                {t('sharedRequired')}
              </Typography>
            </AccordionSummary>
            <AccordionDetails className={classes.details}>
              <TextField
                value={item.name || ''}
                onChange={(event) => setItem({ ...item, name: event.target.value })}
                label={t('sharedName')}
              />
              <FormControl>
                <InputLabel>{t('sharedType')}</InputLabel>
                <Select
                  label={t('sharedType')}
                  value={simple ? 'simple' : 'custom'}
                  onChange={(e) => setItem({ ...item, data: (e.target.value === 'simple' ? simpleCalendar() : null) })}
                >
                  <MenuItem value="simple">{t('calendarSimple')}</MenuItem>
                  <MenuItem value="custom">{t('reportCustom')}</MenuItem>
                </Select>
              </FormControl>
              {simple ? (
                <>
                  <TextField
                    label={t('reportFrom')}
                    type="datetime-local"
                    value={moment(lines[5].slice(-15)).locale('en').format(moment.HTML5_FMT.DATETIME_LOCAL)}
                    onChange={(e) => {
                      const time = formatTime(moment(e.target.value, moment.HTML5_FMT.DATETIME_LOCAL));
                      setItem({ ...item, data: updateCalendar(lines, 5, `DTSTART;${time}`) });
                    }}
                  />
                  <TextField
                    label={t('reportTo')}
                    type="datetime-local"
                    value={moment(lines[6].slice(-15)).locale('en').format(moment.HTML5_FMT.DATETIME_LOCAL)}
                    onChange={(e) => {
                      const time = formatTime(moment(e.target.value, moment.HTML5_FMT.DATETIME_LOCAL));
                      setItem({ ...item, data: updateCalendar(lines, 6, `DTEND;${time}`) });
                    }}
                  />
                  <FormControl>
                    <InputLabel>{t('calendarRecurrence')}</InputLabel>
                    <Select
                      label={t('calendarRecurrence')}
                      value={rule.frequency}
                      onChange={(e) => setItem({ ...item, data: updateCalendar(lines, 7, formatRule({ frequency: e.target.value })) })}
                    >
                      {['ONCE', 'DAILY', 'WEEKLY', 'MONTHLY'].map((it) => (
                        <MenuItem key={it} value={it}>{t(prefixString('calendar', it.toLowerCase()))}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {['WEEKLY', 'MONTHLY'].includes(rule.frequency) && (
                    <FormControl>
                      <InputLabel>{t('calendarDays')}</InputLabel>
                      <Select
                        multiple
                        label={t('calendarDays')}
                        value={rule.by}
                        onChange={(e) => setItem({ ...item, data: updateCalendar(lines, 7, formatRule({ ...rule, by: e.target.value })) })}
                      >
                        {rule.frequency === 'WEEKLY' ? ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((it) => (
                          <MenuItem key={it} value={it.substring(0, 2).toUpperCase()}>{t(prefixString('calendar', it))}</MenuItem>
                        )) : Array.from({ length: 31 }, (_, i) => i + 1).map((it) => (
                          <MenuItem key={it} value={it}>{it}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                </>
              ) : (
                <DropzoneArea
                  dropzoneText={t('sharedDropzoneText')}
                  filesLimit={1}
                  onChange={handleFiles}
                  showAlerts={false}
                />
              )}
            </AccordionDetails>
          </Accordion>
          <EditAttributesAccordion
            attributes={item.attributes}
            setAttributes={(attributes) => setItem({ ...item, attributes })}
            definitions={{}}
          />
        </>
      )}
    </EditItemView>
  );
};

export default CalendarPage;
