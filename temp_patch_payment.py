from pathlib import Path
path = Path('frontend/src/pages/Payment.jsx')
text = path.read_text(encoding='utf-8')
text = text.replace("              [{\n                { id: 'card', icon: '💳', name: 'Credit/Debit Card', desc: 'Visa, Mastercard, Rupay' },\n                { id: 'upi', icon: '📱', name: 'UPI', desc: 'Google Pay, PhonePe, Paytm' },\n                { id: 'netbanking', icon: '🏦', name: 'Net Banking', desc: 'All Indian banks' }\n              ].map((method) => (\n",
                    "              {paymentMethods.map((method) => (\n" )
path.write_text(text, encoding='utf-8')
print('patched')
