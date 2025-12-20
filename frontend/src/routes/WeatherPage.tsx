import { useState, useEffect } from 'react';
import { useAuth } from '../auth/authProvider';
import { weatherService, type WeatherForecast } from '../services/weatherService';
import './WeatherPage.css';

export function WeatherPage() {
    const { isAuthorizedForCriticalOperation } = useAuth();
    const [weatherData, setWeatherData] = useState<WeatherForecast[]>([]);
    const [loading, setLoading] = useState(false);
    const [recomputeLoading, setRecomputeLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [useCelsius, setUseCelsius] = useState(false);

    const fetchWeather = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await weatherService.getPublicForecast();
            setWeatherData(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
        } finally {
            setLoading(false);
        }
    };

    const handleRecompute = async () => {
        setRecomputeLoading(true);
        setError(null);
        setResult(null);
        try {
            const data = await weatherService.recomputeWeatherData();
            setResult(data || 'Operation completed successfully');
            await fetchWeather();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to execute operation');
        } finally {
            setRecomputeLoading(false);
        }
    };

    useEffect(() => {
        fetchWeather();
    }, []);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="weather-page">
            <div className="page-header">
                <h1>Weather Forecast</h1>
                <div className="header-actions">
                    <label className="toggle-switch">
                        <input
                            type="checkbox"
                            checked={useCelsius}
                            onChange={(e) => setUseCelsius(e.target.checked)}
                        />
                        <span>°C</span>
                    </label>
                    <button onClick={fetchWeather} className="btn btn-secondary" disabled={loading}>
                        {loading ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>




            {loading && weatherData.length === 0 ? (
                <div className="loading-state">Loading weather data...</div>
            ) : (
                <div className="weather-grid">
                    {weatherData.map((forecast, index) => (
                        <div key={index} className="weather-card">
                            <div className="weather-date">{formatDate(forecast.date)}</div>
                            <div className="weather-temp">
                                {useCelsius ? forecast.temperatureC : forecast.temperatureF}°
                                {useCelsius ? 'C' : 'F'}
                            </div>
                            <div className="weather-summary">{forecast.summary}</div>
                        </div>
                    ))}
                </div>
            )}
            <hr />
            {isAuthorizedForCriticalOperation && (
                <div className="critical-operations">
                    <div className="operations-header">
                        <h2>Critical Operations</h2>
                        <p className="status-authorized">
                            ✓ You are authorized for critical operations
                        </p>
                    </div>
                    <button
                        onClick={handleRecompute}
                        disabled={recomputeLoading}
                        className="btn btn-primary"
                    >
                        {recomputeLoading ? 'Processing...' : 'Recompute Weather Data'}
                    </button>
                </div>
            )}

            {error && (
                <div className="alert alert-error">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {result && (
                <div className="alert alert-success">
                    <strong>Success:</strong> {result}
                </div>
            )}

        </div>
    );
}
