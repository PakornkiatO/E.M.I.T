import { useEffect, useMemo, useRef, useState } from 'react';
import socket from '../socket/socket';
import axios from 'axios';

function ChatPage({ me, peer, token, onBack }) {
	const [room, setRoom] = useState(null);
	const [messages, setMessages] = useState([]);
	const [text, setText] = useState('');
	const bottomRef = useRef(null);

	const title = useMemo(() => `Chat with ${peer}`, [peer]);

	useEffect(() => {
		if (!peer) return;

		const handleJoined = ({ room, with: target }) => {
			if (target === peer) setRoom(room);
		};
		const handleHistory = ({ room, with: target, messages }) => {
			if (target !== peer) return;
			setMessages(messages);
		};
		const handleNewMessage = ({ room: eventRoom, message }) => {
			if (room && eventRoom !== room) return;
			// If room not set yet, still accept if participants match this chat
			if (!room) {
				const participants = message?.participants || [];
				if (!(participants.includes(me) && participants.includes(peer))) return;
			}
			setMessages(prev => [...prev, message]);
		};
			const handleMessageDeleted = ({ room: eventRoom, id }) => {
				if (room && eventRoom !== room) return;
				setMessages(prev => prev.filter(m => m._id !== id));
			};
			const handleChatCleared = ({ room: eventRoom }) => {
				if (room && eventRoom !== room) return;
				setMessages([]);
			};

		socket.emit('start_chat', { with: peer }, (ack) => {
			if (ack?.ok && ack.room) setRoom(ack.room);
		});

		socket.on('chat_joined', handleJoined);
		socket.on('chat_history', handleHistory);
		socket.on('new_message', handleNewMessage);
			socket.on('message_deleted', handleMessageDeleted);
			socket.on('chat_cleared', handleChatCleared);

		return () => {
			socket.off('chat_joined', handleJoined);
			socket.off('chat_history', handleHistory);
			socket.off('new_message', handleNewMessage);
				socket.off('message_deleted', handleMessageDeleted);
				socket.off('chat_cleared', handleChatCleared);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [peer]);

	useEffect(() => {
		bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
	}, [messages]);

		// Polling fallback to auto-fetch history in case messages are deleted directly in DB
		useEffect(() => {
			if (!peer || !token) return;
			let cancelled = false;
			const API_URL = `http://${window.location.hostname}:3001/api/chat/history/${encodeURIComponent(peer)}`;

			const pull = async () => {
				try {
					const res = await axios.get(API_URL, {
						headers: { Authorization: `Bearer ${token}` },
					});
					if (!cancelled) {
						const serverMessages = res.data?.messages || [];
						setMessages(prev => {
							// Replace list if lengths differ or last ids changed
							if (prev.length !== serverMessages.length) return serverMessages;
							const prevLast = prev[prev.length - 1]?._id;
							const srvLast = serverMessages[serverMessages.length - 1]?._id;
							if (prevLast !== srvLast) return serverMessages;
							return prev;
						});
					}
				} catch (e) {
					// ignore fetch errors
				}
			};

			// initial and interval
			pull();
			const id = setInterval(pull, 3000);
			return () => {
				cancelled = true;
				clearInterval(id);
			};
		}, [peer, token]);

		const send = () => {
			const content = text.trim();
			if (!content) return;
			// Do not optimistic-append; rely on server's new_message broadcast to avoid duplicates
			setText('');
			socket.emit('send_message', { to: peer, content });
		};

	const styles = {
		wrapper: { display: 'flex', flexDirection: 'column', height: '100vh', background: '#f6f7fb' },
			header: { display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: 'white', borderBottom: '1px solid #eee' },
		title: { margin: 0, fontSize: 18, fontWeight: 600 },
		back: { border: 'none', background: '#eee', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' },
			spacer: { flex: 1 },
			clearBtn: { border: 'none', background: '#ffdede', color: '#a33', padding: '8px 12px', borderRadius: 8, cursor: 'pointer' },
		list: { flex: 1, overflowY: 'auto', padding: 20 },
		bubbleRow: { display: 'flex', marginBottom: 10 },
			bubble: { padding: '10px 14px', borderRadius: 12, maxWidth: '70%', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', position: 'relative' },
		me: { marginLeft: 'auto', background: '#667eea', color: 'white', borderBottomRightRadius: 4 },
		other: { marginRight: 'auto', background: 'white', borderBottomLeftRadius: 4 },
			delBtn: { position: 'absolute', top: -8, right: -8, border: 'none', background: '#ffefef', color: '#c33', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', fontSize: 12 },
		inputBar: { display: 'flex', gap: 10, padding: 16, background: 'white', borderTop: '1px solid #eee' },
		input: { flex: 1, padding: 12, border: '1px solid #ddd', borderRadius: 8 },
		sendBtn: { padding: '12px 16px', background: 'linear-gradient(135deg,#667eea,#764ba2)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' },
	};

	return (
		<div style={styles.wrapper}>
			<div style={styles.header}>
				<button style={styles.back} onClick={onBack}>← Back</button>
				<h3 style={styles.title}>{title}</h3>
					<div style={styles.spacer} />
					<button style={styles.clearBtn} onClick={() => socket.emit('clear_chat', { with: peer })}>Clear chat</button>
			</div>
			<div style={styles.list}>
				{messages.map(m => {
					const mine = m.sender === me;
					return (
						<div key={m._id} style={{ ...styles.bubbleRow, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
							<div style={{ ...styles.bubble, ...(mine ? styles.me : styles.other) }}>
								<div style={{ fontSize: 14 }}>{m.content}</div>
								<div style={{ fontSize: 10, opacity: 0.6, marginTop: 6 }}>{new Date(m.createdAt || Date.now()).toLocaleTimeString()}</div>
									{mine && (
										<button style={styles.delBtn} title="Delete" onClick={() => socket.emit('delete_message', { id: m._id })}>×</button>
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
					placeholder={`Message ${peer}...`}
					onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
				/>
				<button style={styles.sendBtn} onClick={send}>Send</button>
			</div>
		</div>
	);
}

export default ChatPage;
