import { useState } from 'react';
import axios from 'axios';

function LoginPage({ onAuth }) {
    const [isLogin, setIsLogin] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    const API_URL = `http://${window.location.hostname}:3001/api/auth`;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const endpoint = isLogin ? `${API_URL}/login` : `${API_URL}/register`;
      
            const response = await axios.post(endpoint, {
                username,
                password
            });

            if (response.data.token) {
                // Login successful - proceed to app
                setSuccess('✅ เข้าสู่ระบบสำเร็จ!');
                
                setTimeout(() => {
                    onAuth(response.data.token, response.data.username);
                }, 800);
            } else {
                // Register successful - switch to login
                setSuccess('✅ สร้างบัญชีสำเร็จ! กำลังกลับไปเข้าสู่ระบบ...');
                setUsername('');
                setPassword('');

                setTimeout(() => {
                    setIsLogin(true);
                    setSuccess('');
                }, 800);
            }
        }
        catch (err) {
            const errorMessage = err.response?.data?.message || 'เกิดข้อผิดพลาด กรุณาลองใหม่';
            setError(errorMessage);
            console.error('Auth error:', err);
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsLogin(!isLogin);
        setError('');
        setSuccess('');
        setUsername('');
        setPassword('');
    };

    const styles = {
        container: {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        },
        box: {
            background: 'white',
            padding: '40px',
            borderRadius: '10px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            width: '100%',
            maxWidth: '400px',
        },
        title: {
            textAlign: 'center',
            color: '#333',
            marginBottom: '30px',
            fontSize: '28px',
            marginTop: '0',
        },
        form: {
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
        },
        formGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        },
        label: {
            color: '#555',
            fontWeight: '600',
            fontSize: '14px',
        },
        input: {
            padding: '12px',
            border: '2px solid #ddd',
            borderRadius: '5px',
            fontSize: '14px',
            transition: 'border-color 0.3s',
            fontFamily: 'inherit',
        },
        inputFocus: {
            borderColor: '#667eea',
            boxShadow: '0 0 5px rgba(102, 126, 234, 0.3)',
        },
        errorMessage: {
            backgroundColor: '#fee',
            color: '#c33',
            padding: '12px',
            borderRadius: '5px',
            fontSize: '14px',
            borderLeft: '4px solid #c33',
        },
        successMessage: {
            backgroundColor: '#efe',
            color: '#3c3',
            padding: '12px',
            borderRadius: '5px',
            fontSize: '14px',
            borderLeft: '4px solid #3c3',
            animation: 'slideIn 0.3s ease-out',
        },
        submitButton: {
            padding: '12px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'opacity 0.3s, transform 0.3s',
        },
        toggleContainer: {
            textAlign: 'center',
            marginTop: '20px',
        },
        toggleText: {
            color: '#666',
            fontSize: '14px',
            marginBottom: '10px',
            margin: '0 0 10px 0',
        },
        toggleButton: {
            background: 'none',
            border: 'none',
            color: '#667eea',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '14px',
            textDecoration: 'underline',
            transition: 'color 0.3s',
        },
    };

    return (
        <>
        <style>{`
            * {
            box-sizing: border-box;
            }
            body {
            margin: 0;
            padding: 0;
            }
            input:focus {
            outline: none;
            border-color: #667eea !important;
            box-shadow: 0 0 5px rgba(102, 126, 234, 0.3) !important;
            }
            input:disabled {
            background-color: #f5f5f5;
            cursor: not-allowed;
            }
            button:hover:not(:disabled) {
            opacity: 0.9;
            transform: translateY(-2px);
            }
            button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            }
            @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(-10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
            }
        `}</style>

        <div style={styles.container}>
            <div style={styles.box}>
            <h1 style={styles.title}>
                {isLogin ? 'เข้าสู่ระบบ' : 'สร้างบัญชี'}
            </h1>

            <form onSubmit={handleSubmit} style={styles.form}>
                {/* Username Input */}
                <div style={styles.formGroup}>
                <label htmlFor="username" style={styles.label}>
                    ชื่อผู้ใช้
                </label>
                <input
                    id="username"
                    type="text"
                    placeholder="กรอกชื่อผู้ใช้"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    disabled={loading}
                    style={styles.input}
                />
                </div>

                {/* Password Input */}
                <div style={styles.formGroup}>
                <label htmlFor="password" style={styles.label}>
                    รหัสผ่าน
                </label>
                <input
                    id="password"
                    type="password"
                    placeholder="กรอกรหัสผ่าน"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                    style={styles.input}
                />
                </div>

                {/* Error Message */}
                {error && (
                <div style={styles.errorMessage}>
                    ⚠️ {error}
                </div>
                )}

                {/* Success Message */}
                {success && (
                <div style={styles.successMessage}>
                    {success}
                </div>
                )}

                {/* Submit Button */}
                <button
                type="submit"
                disabled={loading}
                style={{
                    ...styles.submitButton,
                    opacity: loading ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                    if (!loading) {
                    e.target.style.opacity = '0.9';
                    e.target.style.transform = 'translateY(-2px)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!loading) {
                    e.target.style.opacity = '1';
                    e.target.style.transform = 'translateY(0)';
                    }
                }}
                >
                {loading ? 'กำลังประมวลผล...' : (isLogin ? 'เข้าสู่ระบบ' : 'สร้างบัญชี')}
                </button>
            </form>

            {/* Toggle Between Login/Register */}
            <div style={styles.toggleContainer}>
                <p style={styles.toggleText}>
                {isLogin ? 'ยังไม่มีบัญชี?' : 'มีบัญชีแล้ว?'}
                </p>
                <button
                type="button"
                onClick={toggleMode}
                disabled={loading}
                style={styles.toggleButton}
                onMouseEnter={(e) => {
                    if (!loading) e.target.style.color = '#764ba2';
                }}
                onMouseLeave={(e) => {
                    if (!loading) e.target.style.color = '#667eea';
                }}
                >
                {isLogin ? 'สร้างบัญชีใหม่' : 'เข้าสู่ระบบ'}
                </button>
            </div>
            </div>
        </div>
        </>
    );
}

export default LoginPage;