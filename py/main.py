from tradingview_ta import TA_Handler, Interval
import time
import requests

output15m = TA_Handler(symbol='BTCUSDT',
                    screener='Crypto',
                    exchange='Binance',
                    interval=Interval.INTERVAL_15_MINUTES)

output1w = TA_Handler(symbol='BTCUSDT',
                    screener='Crypto',
                    exchange='Binance',
                    interval=Interval.INTERVAL_1_WEEK)

url = 'http://localhost:3003/'

previousPrice = 0
currentPrice = 0
previousRSI = 0
currentRSI = 0
previousEMA20 = 0
currentEMA20 = 0
previousEMA50 = 0
currentEMA50 = 0
currentStochRSI = 0

print('Application started.')

def hour():
    formatted = f'{time.localtime().tm_hour}:{time.localtime().tm_min}:{time.localtime().tm_sec}'
    print(formatted)


def newOrder(operation):
    response = requests.get(url + operation)
    data = response.json()
    print(data)
    winsound.Beep(5000, 500)
    hour()


def statusRSI(currentRSI, previousRSI):
    if previousRSI <= 30 and currentRSI > 30:
        print('🟢 RSI buy signal', currentRSI)
        return True
    if previousRSI >= 70 and currentRSI < 70:
        print('🔴 RSI sell signal', currentRSI)
        return False
    else:
        print('🟡 RSI neutral:', currentRSI)
        return currentRSI


def statusStochRSI(currentStochRSI):
    if currentStochRSI < 20:
        print('🟢 Stoch RSI buy signal', currentStochRSI)
        return True
    if currentStochRSI > 80:
        print('🔴 Stoch RSI sell signal', currentStochRSI)
        return False
    else:
        print('🟡 Stoch RSI neutral:', currentStochRSI)
        return currentStochRSI
    
    
def statusMACD():
    macd = output15m.get_analysis().indicators['MACD.macd']
    signal = output15m.get_analysis().indicators['MACD.signal']
    if (macd < 0 and signal < 0) and signal < macd:
        print('🟢 Signal lower than MACD above 0', '\n\tMACD:', macd, '\n\tSignal:', signal)
        return True
    if (macd > 0 and signal > 0) and signal > macd:
        print('🔴 Signal higher than MACD above 0', '\n\tMACD:', macd, '\n\tSignal:', signal)
        return False
    else:
        print('🟡 MACD neutral:', '\n\tMACD:', macd, '\n\tSignal:', signal)
        return macd


def isPointedUpEMA20(currentEMA20, previousEMA20):
    if currentEMA20 > previousEMA20:
        print('🟢 EMA 20 is pointed up')
        return True
    else:
        print('🔴 EMA 20 is pointed down')
        return False

    
def isPointedUpEma50(currentEMA50, previousEMA50):
    if currentEMA50 > previousEMA50:
        print('🟢 EMA 50 is pointed up')
        return True
    else:
        print('🔴 EMA 50 is pointed down')
        return False
    

def isEMA20AboveEMA50(currentEMA20, currentEMA50):
    if currentEMA20 > currentEMA50:
        print('🟢 EMA 20 is above EMA 50')
        return True
    else:
        print('🔴 EMA 20 is below EMA 50')
        return False
            

def isPriceAboveWeeklyEMA8():
    ema5 = output1w.get_analysis().indicators['EMA5']
    ema10 = output1w.get_analysis().indicators['EMA10']
    price = output1w.get_analysis().indicators['close']
    ema8 = (ema10+ema5) / 2
    if price > ema8:
        print('🟢 Price is above weekly EMA 8')
        return True
    else:
        print('🔴 Price is below weekly EMA 8')
        return False
    
    
def isPriceAboveEMA200():
    ema200 = output15m.get_analysis().indicators['EMA200']
    price = output15m.get_analysis().indicators['close']
    if price > ema200:
        print('🟢 Price is above EMA 200')
        return True
    else:
        print('🔴 Price is below EMA 200')
        return False


def strategyEMA200andMACD(currentPrice, previousPrice):
    priceAboveEMA200 = isPriceAboveEMA200()
    macd = statusMACD()

## todo: criar estratégias: media 8 semanal, medias 20+50+estocastico, media 200 + macd

while 1 == 1:
    time.sleep(1)
    minute = time.localtime().tm_min
    second = time.localtime().tm_sec
    condition = (minute == 0 and second == 0) or (minute == 15 and second == 0) or \
                (minute == 30 and second == 0) or (minute == 45 and second == 0)

    if condition:
        hour()
        rsi = output15m.get_analysis().indicators['RSI']
        stochRSI = output15m.get_analysis().indicators['Stoch.RSI.K']
        ema20 = output15m.get_analysis().indicators['EMA20']
        ema50 = output15m.get_analysis().indicators['EMA50']
        price = output15m.get_analysis().indicators['close']
        
        if previousRSI == 0:
            previousRSI = rsi
        else:
            previousRSI = currentRSI
        currentRSI = rsi
        
        if previousEMA20 == 0:
            previousEMA20 = ema20
        else:
            previousEMA20 = currentEMA20
        currentEMA20 = ema20
        
        if previousEMA50 == 0:
            previousEMA50 = ema50
        else:
            previousEMA50 = currentEMA50
        currentEMA50 = ema50
        
        evalRSI = statusRSI(currentRSI, previousRSI)

        if evalRSI == False:
            newOrder('sell')
        if evalRSI == True:
            newOrder('buy')

        isPriceAboveWeeklyEMA8()
        isPriceAboveEMA200()
        statusStochRSI(stochRSI)
        isPointedUpEMA20(currentEMA20, previousEMA20)
        isPointedUpEma50(currentEMA50, previousEMA50)
        isEMA20AboveEMA50(currentEMA20, currentEMA50)
        statusMACD()
        

        print('===================================================')
