import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Typography,
  IconButton,
  Box
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Link } from 'react-router-dom';

const UserListDialog = ({ open, onClose, title, users }) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        {title}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <List sx={{ width: '100%' }}>
          {users.length === 0 ? (
            <Typography sx={{ textAlign: 'center', padding: 2 }}>사용자가 없습니다.</Typography>
          ) : (
            users.map((user) => (
              <ListItem
                key={user.id}
                component={Link}
                to={`/profile/${user.id}`}
                onClick={onClose} // 다이얼로그 닫기
                sx={{ textDecoration: 'none', color: 'inherit' }}
              >
                <ListItemAvatar>
                  <Avatar src={`http://localhost:3010${user.profile_image_url}`} />
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                      {user.nickname}
                    </Typography>
                  }
                  secondary={`#${user.nickname_tag}`}
                />
              </ListItem>
            ))
          )}
        </List>
      </DialogContent>
    </Dialog>
  );
};

export default UserListDialog;