import { useEffect, useRef, useState } from 'react';
import socket from '../socket/socket';
import axios from 'axios';

function GroupChatPage({ token, me, group, censorWords = [], onBack }) {
  const [messages, setMessages] = useState([]);
  const [groupInfo, setGroupInfo] = useState(group);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!group?._id) return;

    const handleGroupHistory = ({ groupId, name, messages }) => {
      if (groupId === group._id) setMessages(messages);
    };
    const handleGroupNewMessage = ({ groupId, message }) => {
      if (groupId === group._id) setMessages(prev => [...prev, message]);
    };
    const handleGroupMessageDeleted = ({ groupId, id }) => {
      if (groupId === group._id) setMessages(prev => prev.filter(m => m._id !== id));
    };
    const handleGroupCleared = ({ groupId }) => {
      if (groupId === group._id) setMessages([]);
    };

    socket.emit('join_group', { groupId: group._id }, (ack) => {
      // could inspect ack
    });

    socket.on('group_history', handleGroupHistory);
    socket.on('group_new_message', handleGroupNewMessage);
    socket.on('group_message_deleted', handleGroupMessageDeleted);
    socket.on('group_chat_cleared', handleGroupCleared);

    return () => {
      socket.off('group_history', handleGroupHistory);
      socket.off('group_new_message', handleGroupNewMessage);
      socket.off('group_message_deleted', handleGroupMessageDeleted);
      socket.off('group_chat_cleared', handleGroupCleared);
    };
  }, [group]);

  // Keep local group info in sync when prop changes
  useEffect(() => {
    setGroupInfo(group);
  }, [group]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    const content = text.trim();
    if (!content || !group?._id) return;
    setText('');
    socket.emit('send_group_message', { groupId: group._id, content });
  };

  // Update member count immediately on server push
  useEffect(() => {
    const onGroupsUpdated = (data) => {
      const list = Array.isArray(data?.groups) ? data.groups : [];
      const updated = list.find(g => g._id === group?._id);
      if (updated) setGroupInfo(updated);
    };
    socket.on('groups_updated', onGroupsUpdated);
    return () => socket.off('groups_updated', onGroupsUpdated);
  }, [group?._id]);

  // Poll existence of group and auto-exit if deleted directly in DB; also refresh members
  useEffect(() => {
    if (!group?._id || !token) return;
    let cancelled = false;
    const fetchGroups = async () => {
      try {
        const API_URL = `http://${window.location.hostname}:3001/api/chat/groups`;
        const res = await axios.get(API_URL, { headers: { Authorization: `Bearer ${token}` } });
        const list = res.data?.groups || [];
        const match = list.find(g => g._id === group._id);
        if (!match && !cancelled) {
          alert('This group has been deleted. Returning to lobby.');
          onBack && onBack();
        } else if (match && !cancelled) {
          setGroupInfo(match);
        }
      } catch (e) { /* ignore */ }
    };
    fetchGroups();
    const id = setInterval(fetchGroups, 3000);
    return () => { cancelled = true; clearInterval(id); };
  }, [group?._id, token, onBack]);

  const styles = {
    wrapper: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#f6f7fb' },
    header: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'white', borderBottom: '1px solid #eee' },
    title: { margin: 0, fontSize: 18, fontWeight: 600 },
    back: { border: 'none', background: '#eee', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' },
    members: { fontSize: 12, color: '#667', fontWeight: 500 },
    list: { flex: 1, overflowY: 'auto', padding: 20 },
    bubbleRow: { display: 'flex', marginBottom: 10 },
    bubble: { padding: '10px 14px', borderRadius: 12, maxWidth: '70%', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'relative' },
    me: { marginLeft: 'auto', background: '#667eea', color: 'white', borderBottomRightRadius: 4 },
    other: { marginRight: 'auto', background: 'white', borderBottomLeftRadius: 4 },
    delBtn: { position: 'absolute', top: -8, right: -8, border: 'none', background: '#ffefef', color: '#c33', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 12 },
    inputBar: { display: 'flex', gap: 10, padding: 16, background: 'white', borderTop: '1px solid #eee' },
    input: { flex: 1, padding: 12, border: '1px solid #ddd', borderRadius: 8 },
    sendBtn: { padding: '12px 16px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' },
    spacer: { flex: 1 },
    clearBtn: { border: 'none', background: '#ffdede', color: '#a33', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' },
  };

  // Censor rendering utility (same as in ChatPage)
  const renderContent = (raw) => {
    if (!raw) return '';
    if (!Array.isArray(censorWords) || censorWords.length === 0) return raw;
    const escaped = censorWords.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (escaped.length === 0) return raw;
    const pattern = new RegExp(`(${escaped.join('|')})`, 'giu');
    const parts = raw.split(pattern);
    const matches = raw.match(pattern);
    if (!matches) return raw;
    let matchIndex = 0;
    return parts.map((part, idx) => {
      if (idx % 2 === 1) {
        const word = matches[matchIndex++] || '';
        const widthEm = Math.max(1, (word.length || 3) * 0.6);
        return (
          <span key={idx} style={{ background: '#000', color: '#000', borderRadius: 4, display: 'inline-block', width: `${widthEm}em`, height: '1em', verticalAlign: 'middle' }} title="Censored" />
        );
      }
      return part;
    });
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <button style={styles.back} onClick={onBack}>← Back</button>
  <h3 style={styles.title}>{groupInfo?.name || group?.name || 'Group'}</h3>
  <span style={styles.members}>{Array.isArray(groupInfo?.members) ? groupInfo.members.length : (Array.isArray(group?.members) ? group.members.length : 0)} members</span>
        <div style={styles.spacer} />
        <button style={styles.clearBtn} onClick={() => socket.emit('clear_group_chat', { groupId: group._id })}>Clear chat</button>
      </div>
      <div style={styles.list}>
        {messages.map(m => {
          const mine = m.sender === me;
          return (
            <div key={m._id} style={{ ...styles.bubbleRow, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
              <div style={{ ...styles.bubble, ...(mine ? styles.me : styles.other) }}>
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 4 }}>{m.sender}</div>
                <div style={{ fontSize: 14 }}>{renderContent(m.content)}</div>
                <div style={{ fontSize: 10, opacity: 0.6, marginTop: 6 }}>{new Date(m.createdAt || Date.now()).toLocaleTimeString()}</div>
                {mine && (
                  <button style={styles.delBtn} title="Delete" onClick={() => socket.emit('delete_group_message', { groupId: group._id, id: m._id })}>×</button>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div style={styles.inputBar}>
        <input
          style={styles.input}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Message ${groupInfo?.name || group?.name || 'Group'}...`}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
        />
        <button style={styles.sendBtn} onClick={send}>Send</button>
      </div>
    </div>
  );
}

export default GroupChatPage;
