import os
from os import path
import numpy as np
import pandas as pd
import json
from collections import Counter
import random

from flask import Flask,escape,request,render_template,send_from_directory
from flask.json import jsonify

app = Flask(__name__)
app.config['CORS_HEADERS'] = 'Content-Type'

# FILE_PATH = "/Users/chitrasen/workspace_python/class_works/CS765/"
FILE_PATH = "data/"
print("loading data from file")
cd_data = None
cd_data = pd.read_csv(path.join(FILE_PATH,"CDs_and_Vinyl_5.csv.gz"))
cd_data.columns = [c.strip() for c in cd_data.columns]
data_cache = {}
ratting_cache = {}
print("data loaded")

@app.route('/')
@app.route('/index')
def index():
    return render_template("index.html")

@app.route('/favicon.ico',methods=['GET'])
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'), 'connection.png', mimetype='image/connection.png')

def init():
    #cd_data = pd.read_csv(path.join(FILE_PATH,"Musical_Instruments_5.csv.gz"))

    #loadig the cache
    with open(path.join(FILE_PATH,"graph_cache.txt"),'a+') as f:
        f.seek(0)
        for line in f:
            try:
                cached_line = json.loads(line)
                k = cached_line["key"]
                v = cached_line["result"]
                data_cache[k]= v
            except Exception as e:
                print(e)

    #cd_data.columns = [c.strip() for c in cd_data.columns]
    # cd_meta = {}
    # counter = 0
    # with open("data/CDs_And_Vinyl_meta_5.json") as f:
    #     for line in f:
    #         counter += 1
    #         meta = json.loads(line)
    #         cd_meta[meta['asin']] = meta


@app.route('/getnodes',methods=['GET'])
def get_nodes():
    prodId = request.args.get("prodId", None)
    maxConn = int(request.args.get("maxConn", 5))
    # add var for previous
    print("prodId :::::",prodId)
    if prodId is not None:
        print("Processing...")
        try:
            nodes = None
            k = prodId+'_'+str(maxConn)
            if k in data_cache:
                nodes = data_cache[k]
            else:
                nodes = get_nodes_json(prodId,max_nodes=maxConn)
                data_cache[k] = nodes
                write_to_cache(k,nodes)
            print("Processed...")
            return jsonify(nodes)
        except Exception as e:
            print(e)
            return jsonify({"error":"error"})
            raise(e)
    else:
        return {"error":"error"}

    # with open("static/testing.json") as testing_file:
    #     data = json.load(testing_file)
    # return jsonify(data)
def write_to_cache(k,v):
    with open(path.join(FILE_PATH,"graph_cache.txt"),'a+') as f:
        f.write(json.dumps({'key':k,'result':v}))

@app.route('/gettimeseries',methods=['GET'])
def get_time_series():
    prodId = request.args.get("prodId", None)
    # add var for previous
    print("prodId :::::",prodId)
    if prodId is not None:
        try:
            ts_data = calcualte_moving_averages_single(prodId)
            return ts_data
        except Exception as e:
            print(e)
            return jsonify({"error":"error"})
            raise(e)
    else:
        return {"error":"error"}

@app.route('/getRattings',methods=['GET'])
def ratingCorr():
    prodId = request.args.get("prodId", None)
    if prodId != None:
        try:
            if prodId in ratting_cache:
                return json.dumps(ratting_cache[prodId])

            reviewer_df = get_reviewers(prodId)
            user_rattings = []
            for reviewer_id in reviewer_df.reviewerID.values:
                prod_rat = np.mean(reviewer_df.overall.values[reviewer_df.reviewerID == reviewer_id])
                avg_rat = np.mean(cd_data.overall.values[cd_data.reviewerID == reviewer_id])
                rev_count = int(np.sum(cd_data.reviewerID == reviewer_id))

                user_rattings.append({"rev_id":reviewer_id,
                                     "prod_rat":round(prod_rat,2),
                                     "avg_rat":round(avg_rat,2),
                                     "rev_count":rev_count}
                                    )
            ratting_cache[prodId] = user_rattings
            return json.dumps(user_rattings)
        except Exception as e:
            print(e)
            return jsonify({"error":"error"})
            raise(e)
    else:
        return {"error":"error"}

def get_reviewers(prod_id):
    df_prod = cd_data.loc[cd_data.asin == str(prod_id),:]
    return df_prod

def get_prev_next_buy(df_reviews,prev = True):#takes dataframe filtered for productid
    items = []
    print("df_reviews.reviewerID")
    print(df_reviews.columns)
    for reviewer,review_date in zip(df_reviews.loc[:,"reviewerID"],df_reviews.unixReviewTime):
        if prev:

            user_prev_prod = cd_data.loc[np.logical_and(cd_data.reviewerID == reviewer,
                                                        cd_data.unixReviewTime < review_date)].copy()

            if(len(user_prev_prod) > 0):
                user_prev_prod.sort_values("unixReviewTime", inplace=True,ascending=False)
                items.append(user_prev_prod.asin.values[0])
        else:
            user_prev_prod = cd_data.loc[np.logical_and(cd_data.reviewerID == reviewer,
                                                        cd_data.unixReviewTime > review_date)].copy()

            if(len(user_prev_prod) > 0):
                user_prev_prod.sort_values("unixReviewTime", inplace=True,ascending=True)
                items.append(user_prev_prod.asin.values[0])

    return items

def get_chidren(prod_users_df,prev=True,max_nodes=5):
    sel_items = get_prev_next_buy(prod_users_df,prev=prev)
    sel_items_total = len(sel_items)
    sel_items = Counter(sel_items).most_common(max_nodes)
    time_ = "after"
    if(prev):
        time_ = "before"
    children = []
    for sel_item,sel_counts in sel_items:
        sel_prod_user_df = cd_data.loc[
            np.logical_and(cd_data.asin == sel_item,
                           cd_data.reviewerID.isin(prod_users_df.reviewerID.values))]
        prod_avg_rating = np.mean(sel_prod_user_df.overall)
        prod_avg_all_rating = np.mean(cd_data.overall.values[cd_data.asin == sel_item])
        total_revs = len(cd_data.overall.values[cd_data.asin == sel_item])
        children.append({'name':sel_item,"time":time_,
                         "pct":round(100*sel_counts/sel_items_total),
                        "avg_rating":round(prod_avg_rating,2),
                        "overall_rating":round(prod_avg_all_rating,2),
                        "total_revs":total_revs})
    return children

def get_nodes_json(prod_id,max_nodes=5):
    reviers_df = get_reviewers(prod_id)
    prev_items = get_prev_next_buy(reviers_df,prev=True)
    prev_items_total = len(prev_items)
    prev_items = Counter(prev_items).most_common(max_nodes)

    next_items = get_prev_next_buy(reviers_df,prev=False)
    next_items_total = len(next_items)
    next_items = Counter(next_items).most_common(max_nodes)
    before_children = []
    after_children = []
    children = []
    for prev_item,prev_counts in prev_items:
        sel_prod_user_df = cd_data.loc[
            np.logical_and(cd_data.asin == prev_item,
                           cd_data.reviewerID.isin(reviers_df.reviewerID.values))]
        prod_avg_rating = np.mean(sel_prod_user_df.overall)
        prod_avg_all_rating = np.mean(cd_data.overall.values[cd_data.asin == prev_item])
        total_revs = len(cd_data.overall.values[cd_data.asin == prev_item])
        more_children = get_chidren(sel_prod_user_df,prev=True,max_nodes=max_nodes)
        before_children.append({'name':prev_item,"time":"before",
                         "pct":round(100*prev_counts/prev_items_total),
                        "avg_rating":round(prod_avg_rating,2),
                         "overall_rating":round(prod_avg_all_rating,2),
                         "children":more_children,
                        "total_revs":total_revs})
    for next_item,aft_counts in next_items:
        sel_prod_user_df = cd_data.loc[
            np.logical_and(cd_data.asin == next_item,
                           cd_data.reviewerID.isin(reviers_df.reviewerID.values))]
        prod_avg_rating = np.mean(sel_prod_user_df.overall)
        prod_avg_all_rating = np.mean(cd_data.overall.values[cd_data.asin == next_item])
        total_revs = len(cd_data.overall.values[cd_data.asin == next_item])
        more_children = get_chidren(sel_prod_user_df,prev=False,max_nodes=max_nodes)
        after_children.append({'name':next_item,"time":"after","pct":round(100*aft_counts/next_items_total),
                        "avg_rating":round(prod_avg_rating,2),
                         "overall_rating":round(prod_avg_all_rating,2),
                         "children":more_children,
                        "total_revs":total_revs})

    for i in range(max(len(before_children),len(after_children))):
        if i < len(before_children):
            children.append(before_children[i])
        if i < len(after_children):
            children.append(after_children[i])
    #random.shuffle(children)
    node = {"name":prod_id,"time":"current","children":children,
            "avg_rating":round(np.mean(reviers_df.overall),2),
           "total_revs":len(reviers_df.overall)}
    return node

def calcualte_moving_averages_single(prod):
    ts = [['x'],[prod]]
    prod_df = cd_data.loc[cd_data.asin == prod,:].copy()
    prod_df.sort_values("unixReviewTime", inplace=True,ascending=True)
    prod_df['moving_avg'] = np.round(prod_df.overall.rolling(window=20,min_periods=1).mean(),2)
    prod_df["rev_time"] = pd.to_datetime(prod_df.unixReviewTime,unit='s')

    ts[0].extend(prod_df.rev_time.apply(lambda x: x.strftime('%Y-%m-%d')))
    ts[1].extend(prod_df.moving_avg)

    return json.dumps({"columns":ts})


# def calcualte_moving_averages(products):
#     ts = None
#     for prod in products:
#         prod_df = cd_data.loc[cd_data.asin == prod,:].copy()
#         prod_df.sort_values("unixReviewTime", inplace=True,ascending=True)
#         prod_df['moving_avg'] = prod_df.overall.rolling(window=20,min_periods=1).mean()
#
#         prod_df["rev_time"] = pd.to_datetime(prod_df.unixReviewTime,unit='s')
#         #ts_moving_ratings.append(moving_avg)
#         if isinstance(ts,pd.Series) or isinstance(ts,pd.DataFrame):
#             ts = pd.merge(ts,prod_df.loc[:,["rev_time","moving_avg"]],how="outer",on="rev_time")
#         else:
#             ts = prod_df.loc[:,["rev_time","moving_avg"]]
#     ts.index = ts.rev_time
#     ts.drop('rev_time', inplace=True,axis=1)
#     ts.columns = products
#     ts.fillna(method='ffill', inplace = True)
#     return ts
#
# def create_json_format(df):
#     return_json = []
#     cols = df.columns
#     for col in cols:
#         series_obj = {}
#         series_obj["values"] = df[col].to_json(orient='records')
#         series_obj["key"] = col
#         #series_obj['color'] = col
#         return_json.append(series_obj)
#     return return_json

if __name__ == '__main__':
    init();
    os.environ["FLASK_ENV"] = 'development'
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
