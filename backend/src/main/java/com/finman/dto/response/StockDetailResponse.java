package com.finman.dto.response;

import java.util.ArrayList;
import java.util.List;

public class StockDetailResponse {

    private StockQuoteResponse stock;
    private List<StockPriceHistoryResponse> history = new ArrayList<>();
    private List<NewsArticleResponse> relatedNews = new ArrayList<>();

    public StockDetailResponse() {
    }

    public StockDetailResponse(StockQuoteResponse stock, List<StockPriceHistoryResponse> history, List<NewsArticleResponse> relatedNews) {
        this.stock = stock;
        this.history = history != null ? history : new ArrayList<>();
        this.relatedNews = relatedNews != null ? relatedNews : new ArrayList<>();
    }

    public StockQuoteResponse getStock() {
        return stock;
    }

    public void setStock(StockQuoteResponse stock) {
        this.stock = stock;
    }

    public List<StockPriceHistoryResponse> getHistory() {
        return history;
    }

    public void setHistory(List<StockPriceHistoryResponse> history) {
        this.history = history;
    }

    public List<NewsArticleResponse> getRelatedNews() {
        return relatedNews;
    }

    public void setRelatedNews(List<NewsArticleResponse> relatedNews) {
        this.relatedNews = relatedNews;
    }
}

