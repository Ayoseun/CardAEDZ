
import {
    Wallet,  Loader, Shield,

} from 'lucide-react';




export function LoginScreen({ onLogin, isLoading }: { onLogin: () => void; isLoading: boolean }) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Wallet className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">AEDZ Pay</h1>
                    <p className="text-gray-600">Self-custodial crypto spending platform</p>
                </div>

                <div className="space-y-4">
                    <button
                        onClick={onLogin}
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center space-x-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader className="w-5 h-5 animate-spin" />
                                <span>Connecting...</span>
                            </>
                        ) : (
                            <>
                                <Shield className="w-5 h-5" />
                                <span>Login with Web3Auth</span>
                            </>
                        )}
                    </button>

                    <div className="bg-indigo-50 rounded-lg p-4">
                        <div className="flex items-start space-x-2">
                            <Shield className="w-5 h-5 text-indigo-600 mt-0.5" />
                            <div className="text-sm text-gray-700">
                                <p className="font-semibold mb-1">Secure & Keyless</p>
                                <p className="text-xs">Login with Google, FaceID, or passkey. No seed phrases needed.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
