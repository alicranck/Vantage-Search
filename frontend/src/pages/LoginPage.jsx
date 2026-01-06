import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';

export const LoginPage = () => {
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (isLogin) {
                await login(email, password);
            } else {
                await register(email, password, fullName);
                // After register, switch to login or auto-login
                // For now, let's login automatically if register succeeds
                await login(email, password);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container card-base">
                <div className="login-header">
                    <div className="login-logo-icon">VS</div>
                    <h1 className="login-title">Vantage Search</h1>
                    <p className="login-subtitle">
                        {isLogin ? 'Welcome back! Please login to continue.' : 'Create an account to get started.'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    {!isLogin && (
                        <div className="form-group">
                            <label>Full Name</label>
                            <input
                                type="text"
                                className="login-input"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                required={!isLogin}
                                placeholder="John Doe"
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label>Email</label>
                        <input
                            type="email"
                            className="login-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            className="login-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <Button
                        variant="primary"
                        type="submit"
                        className="w-full mt-4"
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
                    </Button>
                </form>

                <div className="login-footer">
                    <p>
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <button
                            className="text-link"
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError('');
                            }}
                        >
                            {isLogin ? 'Sign up' : 'Login'}
                        </button>
                    </p>
                </div>
            </div>

            <style jsx>{`
                .login-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--bg-app);
                    padding: 20px;
                }
                
                .login-container {
                    width: 100%;
                    max-width: 400px;
                    padding: 40px;
                    background: var(--bg-surface);
                    box-shadow: var(--shadow-xl);
                }

                .login-header {
                    text-align: center;
                    margin-bottom: 30px;
                }

                .login-logo-icon {
                    width: 48px;
                    height: 48px;
                    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-muted) 100%);
                    color: white;
                    border-radius: var(--radius-md);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 800;
                    margin: 0 auto 16px;
                }

                .login-title {
                    font-size: 1.5rem;
                    color: var(--text-primary);
                    margin-bottom: 8px;
                }

                .login-subtitle {
                    color: var(--text-secondary);
                    font-size: 0.9rem;
                }

                .form-group {
                    margin-bottom: 16px;
                }

                .form-group label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: var(--text-primary);
                    margin-bottom: 6px;
                }

                .login-input {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid var(--border-subtle);
                    border-radius: var(--radius-sm);
                    font-family: var(--font-body);
                    background: var(--bg-muted);
                    transition: all 0.2s;
                }

                .login-input:focus {
                    outline: none;
                    border-color: var(--primary);
                    background: var(--bg-surface);
                    box-shadow: 0 0 0 3px var(--primary-subtle);
                }

                .login-error {
                    background: var(--error-subtle);
                    color: var(--error);
                    padding: 10px;
                    border-radius: var(--radius-sm);
                    font-size: 0.85rem;
                    margin-bottom: 16px;
                    text-align: center;
                }

                .login-footer {
                    margin-top: 24px;
                    text-align: center;
                    font-size: 0.9rem;
                    color: var(--text-secondary);
                }

                .text-link {
                    color: var(--primary);
                    font-weight: 600;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                }
                
                .text-link:hover {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
};
